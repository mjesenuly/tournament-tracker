import { tournamentStats } from "./results.js";
import { randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { Express } from "express";
import type { createAuth } from "./auth.js";
import { publicTeam } from "./projections.js";
export function registerTournaments(
  app: Express,
  db: DatabaseSync,
  auth: ReturnType<typeof createAuth>,
) {
  for (const col of ["description", "venue", "start_date"]) {
    const columns = db.prepare("PRAGMA table_info(tournaments)").all();
    if (!columns.some((c) => c.name === col))
      db.exec(
        `ALTER TABLE tournaments ADD COLUMN ${col} TEXT NOT NULL DEFAULT ''`,
      );
  }
  const list = () =>
    db
      .prepare(
        `SELECT t.id,t.name,t.description,t.venue,t.start_date,t.status,t.window_state,t.created_at,(SELECT COUNT(*) FROM applications a WHERE a.tournament_id=t.id AND a.status='accepted') team_count,(SELECT COUNT(*) FROM fixtures f WHERE f.tournament_id=t.id) match_count,(SELECT COUNT(*) FROM fixtures f WHERE f.tournament_id=t.id AND f.status='finished') finished_count FROM tournaments t ORDER BY t.created_at DESC`,
      )
      .all();
  app.get("/api/tournaments", (_req, res) => res.json(list()));
  app.get("/api/tournaments/:id", (req, res) => {
    const tournament = list().find((t) => t.id === req.params.id);
    if (!tournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }
    const teams = db
      .prepare(
        "SELECT * FROM applications WHERE tournament_id=? AND status='accepted'",
      )
      .all(String(req.params.id))
      .map((t) =>
        publicTeam(
          t,
          db
            .prepare(
              "SELECT p.* FROM players p JOIN memberships m ON m.player_id=p.id WHERE m.application_id=? AND m.removed_at IS NULL",
            )
            .all(String(t.id)),
        ),
      );
    const fixtures = db
      .prepare(
        "SELECT f.*,h.team_name home_name,a.team_name away_name FROM fixtures f JOIN applications h ON h.id=f.home_id JOIN applications a ON a.id=f.away_id WHERE f.tournament_id=? ORDER BY f.round,f.scheduled_at",
      )
      .all(String(req.params.id));
    const s = auth.session(req);
    const owner = db
      .prepare("SELECT organizer_id FROM tournaments WHERE id=?")
      .get(String(req.params.id));
    res.json({
      ...tournament,
      ...tournamentStats(db, String(req.params.id)),
      teams,
      fixtures,
      canManage: s?.role === "organizer" && s.id === owner?.organizer_id,
    });
  });
  function fields(body: Record<string, unknown>) {
    const name = String(body.name || "").trim(),
      description = String(body.description || "").trim(),
      venue = String(body.venue || "").trim(),
      startDate = String(body.startDate || "").trim();
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !Number.isFinite(Date.parse(startDate + "T00:00:00Z")) ||
      new Date(startDate + "T00:00:00Z").toISOString().slice(0, 10) !==
        startDate
    )
      throw Error("A valid tournament start date is required (YYYY-MM-DD).");
    if (
      name.length < 3 ||
      name.length > 100 ||
      description.length > 1000 ||
      venue.length > 150
    )
      throw Error(
        "Name must contain 3–100 characters; description maximum 1000 and venue maximum 150.",
      );
    return { name, description, venue, startDate };
  }
  app.post("/api/tournaments", auth.requireUser, (req, res) => {
    if (res.locals.user.role !== "organizer") {
      res.status(403).json({ error: "Preassigned organizer required" });
      return;
    }
    try {
      const f = fields(req.body),
        id = randomBytes(16).toString("hex");
      db.prepare(
        "INSERT INTO tournaments(id,organizer_id,name,description,venue,start_date) VALUES(?,?,?,?,?,?)",
      ).run(
        id,
        res.locals.user.id,
        f.name,
        f.description,
        f.venue,
        f.startDate,
      );
      res.status(201).json({ id, ...f });
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
    }
  });
  app.patch(
    "/api/tournaments/:id",
    auth.requireUser,
    auth.requireOwner,
    (req, res) => {
      try {
        const f = fields(req.body);
        db.prepare(
          "UPDATE tournaments SET name=?,description=?,venue=?,start_date=? WHERE id=?",
        ).run(
          f.name,
          f.description,
          f.venue,
          f.startDate,
          String(req.params.id),
        );
        res.json({ id: req.params.id, ...f });
      } catch (e) {
        res.status(400).json({ error: (e as Error).message });
      }
    },
  );
}
