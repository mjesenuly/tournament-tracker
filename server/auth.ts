import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
export interface Identity {
  sub: string;
  email: string;
  name?: string;
  email_verified?: boolean;
  nonce?: string;
}
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}
export interface AuthOptions {
  clientId?: string;
  organizers?: string[];
  demo?: boolean;
  production?: boolean;
  now?: () => number;
  verify?: (credential: string) => Promise<Identity>;
}
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const secret = () => randomBytes(32).toString("hex");
function cookies(req: Request) {
  return Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((s) => s.trim().split("="))
      .filter((a) => a.length === 2),
  );
}
function equal(a: string, b: string) {
  return (
    a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))
  );
}
export function createAuth(db: DatabaseSync, options: AuthOptions = {}) {
  const production =
    options.production ?? process.env.NODE_ENV === "production";
  const demo =
    (options.demo ?? process.env.DEMO_MODE === "true") && !production;
  const clientId = options.clientId ?? process.env.GOOGLE_CLIENT_ID;
  const organizers = new Set(
    (options.organizers ?? (process.env.ORGANIZER_EMAILS || "").split(","))
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  const now = options.now || Date.now;
  db.exec(
    "CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), csrf TEXT NOT NULL, expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS login_challenges (nonce_hash TEXT PRIMARY KEY, expires INTEGER NOT NULL);",
  );
  const cookieOptions = {
    httpOnly: true,
    secure: production,
    sameSite: "lax" as const,
    path: "/",
  };
  const verify =
    options.verify ||
    (async (credential: string) => {
      if (!clientId) throw Error("Google sign-in is not configured");
      const ticket = await new OAuth2Client(clientId).verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload) throw Error("Invalid token");
      return payload as Identity;
    });
  function issueSession(res: Response, user: User) {
    const token = secret(),
      csrf = secret();
    db.prepare("INSERT INTO sessions VALUES(?,?,?,?)").run(
      hash(token),
      user.id,
      csrf,
      now() + 8 * 60 * 60 * 1000,
    );
    res.cookie("tt_session", token, {
      ...cookieOptions,
      maxAge: 8 * 60 * 60 * 1000,
    });
    return { user, csrf };
  }
  function session(req: Request) {
    const token = cookies(req).tt_session;
    if (!token) return undefined;
    return db
      .prepare(
        "SELECT u.id,u.email,u.name,u.role,s.csrf FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?",
      )
      .get(hash(token), now()) as (User & { csrf: string }) | undefined;
  }
  function requireUser(req: Request, res: Response, next: NextFunction) {
    const s = session(req);
    if (!s) {
      res.status(401).json({ error: "Sign in required" });
      return;
    }
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      !equal(String(req.headers["x-csrf-token"] || ""), s.csrf)
    ) {
      res.status(403).json({ error: "Invalid request token" });
      return;
    }
    res.locals.user = s;
    next();
  }
  function requireOwner(req: Request, res: Response, next: NextFunction) {
    const u = res.locals.user as User;
    const t = db
      .prepare("SELECT organizer_id FROM tournaments WHERE id=?")
      .get(String(req.params.id));
    if (!t) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }
    if (u.role !== "organizer" || t.organizer_id !== u.id) {
      res.status(403).json({ error: "Tournament owner required" });
      return;
    }
    next();
  }
  return {
    demo,
    clientId,
    session,
    requireUser,
    requireOwner,
    config: (req: Request, res: Response) => {
      const nonce = secret();
      db.prepare("DELETE FROM login_challenges WHERE expires<=?").run(now());
      db.prepare("INSERT INTO login_challenges VALUES(?,?)").run(
        hash(nonce),
        now() + 10 * 60 * 1000,
      );
      res.cookie("tt_login", nonce, {
        ...cookieOptions,
        maxAge: 10 * 60 * 1000,
      });
      res.json({ clientId: clientId || null, nonce, demo });
    },
    google: async (req: Request, res: Response) => {
      try {
        const nonce = cookies(req).tt_login;
        if (!nonce || !equal(nonce, String(req.body.nonce || "")))
          throw Error("Invalid login challenge");
        const row = db
          .prepare(
            "SELECT * FROM login_challenges WHERE nonce_hash=? AND expires>?",
          )
          .get(hash(nonce), now());
        db.prepare("DELETE FROM login_challenges WHERE nonce_hash=?").run(
          hash(nonce),
        );
        if (!row) throw Error("Expired login challenge");
        const identity = await verify(String(req.body.credential || ""));
        if (
          !identity.email_verified ||
          identity.nonce !== nonce ||
          !identity.sub ||
          !identity.email
        )
          throw Error("Invalid Google identity");
        const email = identity.email.toLowerCase();
        const role = organizers.has(email) ? "organizer" : "captain";
        const existing = db
          .prepare("SELECT id FROM users WHERE google_sub=?")
          .get(identity.sub);
        const id = String(existing?.id || randomBytes(16).toString("hex"));
        db.prepare(
          "INSERT INTO users(id,google_sub,email,name,role) VALUES(?,?,?,?,?) ON CONFLICT(google_sub) DO UPDATE SET email=excluded.email,name=excluded.name,role=excluded.role",
        ).run(id, identity.sub, email, identity.name || email, role);
        res.clearCookie("tt_login", cookieOptions);
        res.json(
          issueSession(res, { id, email, name: identity.name || email, role }),
        );
      } catch {
        res.status(401).json({ error: "Google sign-in failed. Please retry." });
      }
    },
    demoLogin: (req: Request, res: Response) => {
      if (!demo) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      const role = req.body.role === "organizer" ? "organizer" : "captain";
      const id = `demo-${role}`,
        email = `${role}@demo.invalid`,
        name = `Demo ${role}`;
      db.prepare(
        "INSERT OR IGNORE INTO users(id,email,name,role) VALUES(?,?,?,?)",
      ).run(id, email, name, role);
      res.json({ ...issueSession(res, { id, email, name, role }), demo: true });
    },
    logout: (req: Request, res: Response) => {
      const token = cookies(req).tt_session;
      if (token)
        db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hash(token));
      res.clearCookie("tt_session", cookieOptions);
      res.json({ ok: true });
    },
  };
}
