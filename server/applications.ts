import { randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { Express } from "express";
import type { createAuth } from "./auth.js";
import { transaction } from "./db.js";
export const positions = ["Goalkeeper", "Defender", "Midfielder", "Forward"];
export const id = () => randomBytes(16).toString("hex");
export const normalizeId = (s: unknown) =>
  String(s || "")
    .trim()
    .toUpperCase();
export function validatePlayers(players: any[]) {
  if (!Array.isArray(players) || players.length < 6 || players.length > 13)
    throw Error("A team must have 6–13 players.");
  const ids = new Set<string>(),
    numbers = new Set<number>();
  const normalized = players.map((p) => {
    const name = String(p.name || "").trim(),
      studentId = normalizeId(p.studentId),
      shirtNumber = Number(p.shirtNumber),
      position = String(p.position || "");
    if (
      name.length < 2 ||
      name.length > 100 ||
      !studentId ||
      studentId.length > 60 ||
      !Number.isInteger(shirtNumber) ||
      shirtNumber < 1 ||
      shirtNumber > 99 ||
      !positions.includes(position)
    )
      throw Error(
        "Complete all player fields with a valid position and shirt number 1–99.",
      );
    if (ids.has(studentId) || numbers.has(shirtNumber))
      throw Error(
        "Student IDs and shirt numbers must be unique within the team.",
      );
    ids.add(studentId);
    numbers.add(shirtNumber);
    return { name, studentId, shirtNumber, position };
  });
  if (!normalized.some((p) => p.position === "Goalkeeper"))
    throw Error("At least one goalkeeper is required.");
  return normalized;
}
export function registerApplications(
  app: Express,
  db: DatabaseSync,
  auth: ReturnType<typeof createAuth>,
) {
  app.get("/api/tournaments/:id/applications", auth.requireUser, (req, res) => {
    const user = res.locals.user;
    const t = db
      .prepare("SELECT * FROM tournaments WHERE id=?")
      .get(String(req.params.id));
    if (!t) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }
    const owner = user.role === "organizer" && t.organizer_id === user.id;
    const applications = owner
      ? db
          .prepare("SELECT * FROM applications WHERE tournament_id=?")
          .all(String(t.id))
      : db
          .prepare(
            "SELECT * FROM applications WHERE tournament_id=? AND captain_id=?",
          )
          .all(String(t.id), user.id);
    res.json(
      applications.map((a) => ({
        ...a,
        players: db
          .prepare(
            "SELECT p.*, EXISTS(SELECT 1 FROM memberships m WHERE m.player_id=p.id AND m.removed_at IS NULL) active FROM players p WHERE application_id=?",
          )
          .all(String(a.id)),
      })),
    );
  });
  app.post(
    "/api/tournaments/:id/applications",
    auth.requireUser,
    (req, res) => {
      try {
        const tournament = db
          .prepare("SELECT * FROM tournaments WHERE id=?")
          .get(String(req.params.id));
        if (!tournament) {
          res.status(404).json({ error: "Tournament not found" });
          return;
        }
        if (tournament.status !== "registration")
          throw Error("Team registration is closed.");
        if (
          db
            .prepare(
              "SELECT id FROM applications WHERE tournament_id=? AND captain_id=? AND status<>?",
            )
            .get(String(tournament.id), res.locals.user.id, "rejected")
        )
          throw Error(
            "You already have a pending or accepted team in this tournament.",
          );
        const teamName = String(req.body.teamName || "").trim(),
          captainName = String(req.body.captainName || "").trim(),
          captainContact = String(req.body.captainContact || "").trim();
        if (
          teamName.length < 2 ||
          teamName.length > 100 ||
          captainName.length < 2 ||
          captainName.length > 100 ||
          captainContact.length < 3 ||
          captainContact.length > 150
        )
          throw Error("Enter team name, captain name and contact.");
        const players = validatePlayers(req.body.players),
          applicationId = id();
        transaction(db, () => {
          db.prepare(
            "INSERT INTO applications(id,tournament_id,captain_id,team_name,captain_name,captain_contact) VALUES(?,?,?,?,?,?)",
          ).run(
            applicationId,
            String(tournament.id),
            res.locals.user.id,
            teamName,
            captainName,
            captainContact,
          );
          for (const p of players)
            db.prepare(
              "INSERT INTO players(id,tournament_id,application_id,name,student_id,shirt_number,position) VALUES(?,?,?,?,?,?,?)",
            ).run(
              id(),
              String(tournament.id),
              applicationId,
              p.name,
              p.studentId,
              p.shirtNumber,
              p.position,
            );
        });
        res.status(201).json({ id: applicationId, status: "pending" });
      } catch (e) {
        res
          .status(400)
          .json({
            error: (e as Error).message.includes("UNIQUE")
              ? "This team name is already registered."
              : (e as Error).message,
          });
      }
    },
  );
  app.post(
    "/api/tournaments/:id/applications/:applicationId/review",
    auth.requireUser,
    auth.requireOwner,
    (req, res) => {
      try {
        if (!["accepted", "rejected"].includes(req.body.status))
          throw Error("Choose accept or reject.");
        transaction(db, () => {
          const t = db
            .prepare("SELECT status FROM tournaments WHERE id=?")
            .get(String(req.params.id));
          if (t?.status !== "registration")
            throw Error("Registration is closed.");
          const a = db
            .prepare(
              "SELECT * FROM applications WHERE id=? AND tournament_id=? AND status='pending'",
            )
            .get(String(req.params.applicationId), String(req.params.id));
          if (!a) throw Error("Pending application not found.");
          if (req.body.status === "accepted") {
            const players = db
              .prepare("SELECT * FROM players WHERE application_id=?")
              .all(String(a.id));
            validatePlayers(
              players.map((p) => ({
                name: p.name,
                studentId: p.student_id,
                shirtNumber: p.shirt_number,
                position: p.position,
              })),
            );
            for (const p of players) {
              db.prepare("INSERT INTO eligibility VALUES(?,?,?)").run(
                String(req.params.id),
                String(p.student_id),
                String(a.id),
              );
              db.prepare(
                "INSERT INTO memberships(player_id,application_id) VALUES(?,?)",
              ).run(String(p.id), String(a.id));
            }
          }
          db.prepare("UPDATE applications SET status=? WHERE id=?").run(
            req.body.status,
            String(a.id),
          );
        });
        res.json({ ok: true });
      } catch (e) {
        res
          .status(400)
          .json({
            error: (e as Error).message.includes("UNIQUE")
              ? "A player is already registered with another team in this tournament."
              : (e as Error).message,
          });
      }
    },
  );
}
