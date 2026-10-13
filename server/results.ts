import type { DatabaseSync } from "node:sqlite";
import type { Express } from "express";
import type { createAuth } from "./auth.js";
import { transaction } from "./db.js";
export function standings(teams: any[], fixtures: any[]) {
  const map = new Map(
    teams.map((t) => [
      t.id,
      {
        id: t.id,
        name: t.team_name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0,
        rank: 0,
      },
    ]),
  );
  for (const f of fixtures.filter((f) => f.status === "finished")) {
    const h = map.get(f.home_id),
      a = map.get(f.away_id);
    if (!h || !a) continue;
    h.played++;
    a.played++;
    h.gf += f.home_score;
    h.ga += f.away_score;
    a.gf += f.away_score;
    a.ga += f.home_score;
    if (f.home_score > f.away_score) {
      h.wins++;
      a.losses++;
      h.points += 3;
    } else if (f.home_score < f.away_score) {
      a.wins++;
      h.losses++;
      a.points += 3;
    } else {
      h.draws++;
      a.draws++;
      h.points++;
      a.points++;
    }
  }
  const rows = [...map.values()]
    .map((t) => ({ ...t, gd: t.gf - t.ga }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.name.localeCompare(b.name),
    );
  rows.forEach((r, i) => {
    const p = rows[i - 1];
    r.rank =
      p && p.points === r.points && p.gd === r.gd && p.gf === r.gf
        ? p.rank
        : i + 1;
  });
  return rows;
}
export function tournamentStats(db: DatabaseSync, id: string) {
  const teams = db
      .prepare(
        "SELECT id,team_name FROM applications WHERE tournament_id=? AND status='accepted'",
      )
      .all(id),
    fixtures = db
      .prepare("SELECT * FROM fixtures WHERE tournament_id=?")
      .all(id);
  const table = standings(teams, fixtures);
  const scorers = db
    .prepare(
      `SELECT p.id,p.name,a.team_name,COUNT(*) goals FROM goals g JOIN fixtures f ON f.id=g.fixture_id JOIN players p ON p.id=g.player_id JOIN applications a ON a.id=p.application_id WHERE f.tournament_id=? AND f.status='finished' AND g.own_goal=0 GROUP BY p.id ORDER BY goals DESC,p.name`,
    )
    .all(id);
  return {
    standings: table,
    scorers,
    champions:
      fixtures.length && fixtures.every((f) => f.status === "finished")
        ? table.filter((t) => t.rank === 1)
        : [],
  };
}
export function registerResults(
  app: Express,
  db: DatabaseSync,
  auth: ReturnType<typeof createAuth>,
) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS fixture_players (fixture_id TEXT NOT NULL REFERENCES fixtures(id),player_id TEXT NOT NULL REFERENCES players(id),team_id TEXT NOT NULL REFERENCES applications(id),PRIMARY KEY(fixture_id,player_id));",
  );
  app.get("/api/tournaments/:id/fixtures/:fixtureId/players", (req, res) => {
    const f = db
      .prepare("SELECT * FROM fixtures WHERE id=? AND tournament_id=?")
      .get(String(req.params.fixtureId), String(req.params.id));
    if (!f) {
      res.status(404).json({ error: "Fixture not found" });
      return;
    }
    let players = db
      .prepare(
        "SELECT p.id,p.name,p.shirt_number,s.team_id FROM fixture_players s JOIN players p ON p.id=s.player_id WHERE s.fixture_id=?",
      )
      .all(String(f.id));
    if (!players.length)
      players = db
        .prepare(
          "SELECT p.id,p.name,p.shirt_number,m.application_id team_id FROM memberships m JOIN players p ON p.id=m.player_id WHERE m.application_id IN (?,?) AND julianday(m.joined_at)<=julianday(?) AND (m.removed_at IS NULL OR julianday(m.removed_at)>julianday(?))",
        )
        .all(
          String(f.home_id),
          String(f.away_id),
          String(f.scheduled_at || new Date().toISOString()),
          String(f.scheduled_at || new Date().toISOString()),
        );
    res.json(players);
  });
  app.put(
    "/api/tournaments/:id/fixtures/:fixtureId/result",
    auth.requireUser,
    auth.requireOwner,
    (req, res) => {
      try {
        const { homeScore, awayScore, goals } = req.body;
        if (
          !Number.isInteger(homeScore) ||
          !Number.isInteger(awayScore) ||
          homeScore < 0 ||
          awayScore < 0 ||
          homeScore > 100 ||
          awayScore > 100 ||
          !Array.isArray(goals) ||
          goals.length > 200
        )
          throw Error(
            "Scores must be integers 0–100 and goal events are required.",
          );
        transaction(db, () => {
          const f = db
            .prepare("SELECT * FROM fixtures WHERE id=? AND tournament_id=?")
            .get(String(req.params.fixtureId), String(req.params.id));
          if (!f) throw Error("Fixture not found.");
          if (f.scheduled_at && Date.parse(String(f.scheduled_at)) > Date.now())
            throw Error("A future fixture cannot be finalized.");
          const previous = db
            .prepare(
              "SELECT player_id,team_id FROM fixture_players WHERE fixture_id=?",
            )
            .all(String(f.id));
          if (!previous.length) {
            const members = db
              .prepare(
                "SELECT player_id,application_id FROM memberships WHERE application_id IN (?,?) AND julianday(joined_at)<=julianday(?) AND (removed_at IS NULL OR julianday(removed_at)>julianday(?))",
              )
              .all(
                String(f.home_id),
                String(f.away_id),
                String(f.scheduled_at || new Date().toISOString()),
                String(f.scheduled_at || new Date().toISOString()),
              );
            for (const m of members)
              db.prepare("INSERT INTO fixture_players VALUES(?,?,?)").run(
                String(f.id),
                String(m.player_id),
                String(m.application_id),
              );
          }
          const eligible = db
            .prepare(
              "SELECT player_id,team_id FROM fixture_players WHERE fixture_id=?",
            )
            .all(String(f.id));
          let h = 0,
            a = 0;
          for (const g of goals) {
            if (typeof g.ownGoal !== "boolean")
              throw Error("Every goal needs an own-goal flag.");
            const p = eligible.find((p) => p.player_id === g.playerId);
            if (!p)
              throw Error(
                "Scorer is not eligible for this historical fixture.",
              );
            const credited = g.ownGoal
              ? p.team_id === f.home_id
                ? f.away_id
                : f.home_id
              : p.team_id;
            if (credited === f.home_id) h++;
            else a++;
          }
          if (h !== homeScore || a !== awayScore)
            throw Error(
              "Goal events must match both team scores, including own goals.",
            );
          db.prepare("DELETE FROM goals WHERE fixture_id=?").run(String(f.id));
          for (const g of goals)
            db.prepare(
              "INSERT INTO goals(fixture_id,player_id,own_goal) VALUES(?,?,?)",
            ).run(String(f.id), String(g.playerId), g.ownGoal ? 1 : 0);
          db.prepare(
            "UPDATE fixtures SET status='finished',home_score=?,away_score=? WHERE id=?",
          ).run(homeScore, awayScore, String(f.id));
          const pending = db
            .prepare(
              "SELECT COUNT(*) n FROM fixtures WHERE tournament_id=? AND status<>'finished'",
            )
            .get(String(req.params.id));
          db.prepare("UPDATE tournaments SET status=? WHERE id=?").run(
            pending?.n === 0 ? "completed" : "ongoing",
            String(req.params.id),
          );
        });
        res.json({ ok: true });
      } catch (e) {
        res.status(400).json({ error: (e as Error).message });
      }
    },
  );
  app.get("/api/tournaments/:id/fixtures/:fixtureId/goals", (req, res) => {
    res.json(
      db
        .prepare(
          "SELECT g.player_id playerId,g.own_goal ownGoal FROM goals g JOIN fixtures f ON f.id=g.fixture_id WHERE f.id=? AND f.tournament_id=?",
        )
        .all(String(req.params.fixtureId), String(req.params.id))
        .map((g) => ({ ...g, ownGoal: g.ownGoal === 1 })),
    );
  });
}
