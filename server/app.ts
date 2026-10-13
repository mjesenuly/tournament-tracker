import express from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { registerRosters } from "./rosters.js";
import { registerResults } from "./results.js";
import { registerFixtures } from "./fixtures.js";
import { registerApplications } from "./applications.js";
import { registerTournaments } from "./tournaments.js";
import { openDatabase } from "./db.js";
import { createAuth, type AuthOptions } from "./auth.js";
export function createApp(db = openDatabase(), options: AuthOptions = {}) {
  const app = express();
  const auth = createAuth(db, options);
  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));
  app.get("/api/health", (_req, res) => {
    db.prepare("SELECT 1").get();
    res.json({ status: "ok" });
  });
  app.get("/api/auth/config", auth.config);
  app.post("/api/auth/google", auth.google);
  app.post("/api/auth/demo", auth.demoLogin);
  app.get("/api/auth/me", (req, res) => {
    const s = auth.session(req);
    res.json(
      s
        ? {
            user: { id: s.id, email: s.email, name: s.name, role: s.role },
            csrf: s.csrf,
          }
        : { user: null },
    );
  });
  app.post("/api/auth/logout", auth.requireUser, auth.logout);
  registerTournaments(app, db, auth);
  registerApplications(app, db, auth);
  registerFixtures(app, db, auth);
  registerResults(app, db, auth);
  registerRosters(app, db, auth);
  app.locals.auth = auth;
  app.locals.db = db;
  const dist = resolve("dist");
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get("/", (_req, res) => res.sendFile(resolve(dist, "index.html")));
  }
  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res
        .status(err.status === 400 ? 400 : 500)
        .json({
          error:
            err.status === 400
              ? "Invalid JSON request"
              : "Unexpected server error",
        });
    },
  );
  return app;
}
