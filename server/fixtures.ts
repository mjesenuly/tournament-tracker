import type { DatabaseSync } from "node:sqlite";
import type { Express } from "express";
import type { createAuth } from "./auth.js";
import { transaction } from "./db.js";
import { id } from "./applications.js";
export function roundRobin(teamIds: string[]) {
  if (teamIds.length < 2 || new Set(teamIds).size !== teamIds.length)
    throw Error("At least two distinct teams are required.");
  const wheel: (string | null)[] = [...teamIds];
  if (wheel.length % 2) wheel.push(null);
  const pairs: { home: string; away: string; round: number }[] = [];
  for (let r = 1; r < wheel.length; r++) {
    for (let i = 0; i < wheel.length / 2; i++) {
      const a = wheel[i],
        b = wheel[wheel.length - 1 - i];
      if (a && b)
        pairs.push({ home: r % 2 ? a : b, away: r % 2 ? b : a, round: r });
    }
    wheel.splice(1, 0, wheel.pop()!);
  }
  return pairs;
}
export function registerFixtures(
  app: Express,
  db: DatabaseSync,
  auth: ReturnType<typeof createAuth>,
) {
  app.post(
    "/api/tournaments/:id/fixtures/generate",
    auth.requireUser,
    auth.requireOwner,
    (req, res) => {
      try {
        transaction(db, () => {
          const t = db
            .prepare("SELECT status FROM tournaments WHERE id=?")
            .get(String(req.params.id));
          if (
            t?.status !== "registration" ||
            db
              .prepare("SELECT id FROM fixtures WHERE tournament_id=? LIMIT 1")
              .get(String(req.params.id))
          )
            throw Error("Fixtures have already been generated.");
          const teams = db
            .prepare(
              "SELECT id FROM applications WHERE tournament_id=? AND status='accepted' ORDER BY id",
            )
            .all(String(req.params.id))
            .map((t) => String(t.id));
          for (const pair of roundRobin(teams))
            db.prepare(
              "INSERT INTO fixtures(id,tournament_id,home_id,away_id,round) VALUES(?,?,?,?,?)",
            ).run(
              id(),
              String(req.params.id),
              pair.home,
              pair.away,
              pair.round,
            );
          db.prepare("UPDATE tournaments SET status='ongoing' WHERE id=?").run(
            String(req.params.id),
          );
        });
        res.json({ ok: true });
      } catch (e) {
        res.status(400).json({ error: (e as Error).message });
      }
    },
  );
  app.patch(
    "/api/tournaments/:id/fixtures/:fixtureId",
    auth.requireUser,
    auth.requireOwner,
    (req, res) => {
      try {
        const fixture = db
          .prepare("SELECT * FROM fixtures WHERE id=? AND tournament_id=?")
          .get(String(req.params.fixtureId), String(req.params.id));
        if (!fixture) throw Error("Fixture not found.");
        const raw = String(req.body.scheduledAt || ""),
          venue = String(req.body.venue || "").trim();
        if (
          !raw ||
          !Number.isFinite(Date.parse(raw)) ||
          !/(Z|[+-]\d\d:\d\d)$/.test(raw)
        )
          throw Error("Provide a valid date/time with timezone.");
        if (!venue || venue.length > 150)
          throw Error("Venue is required (maximum 150 characters).");
        const scheduledAt = new Date(raw).toISOString();
        const conflict = db
          .prepare(
            "SELECT id FROM fixtures WHERE id<>? AND tournament_id=? AND scheduled_at=? AND (venue=? OR home_id IN (?,?) OR away_id IN (?,?))",
          )
          .get(
            String(fixture.id),
            String(req.params.id),
            scheduledAt,
            venue,
            String(fixture.home_id),
            String(fixture.away_id),
            String(fixture.home_id),
            String(fixture.away_id),
          );
        if (conflict)
          throw Error(
            "This team or venue already has a fixture at that kickoff time.",
          );
        db.prepare("UPDATE fixtures SET scheduled_at=?,venue=? WHERE id=?").run(
          scheduledAt,
          venue,
          String(fixture.id),
        );
        res.json({ ok: true });
      } catch (e) {
        res.status(400).json({ error: (e as Error).message });
      }
    },
  );
}
