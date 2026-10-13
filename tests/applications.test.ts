import test from "node:test";
import assert from "node:assert/strict";
import { validatePlayers } from "../server/applications.js";
import { createApp } from "../server/app.js";
import { openDatabase } from "../server/db.js";
const roster = (prefix: string) =>
  Array.from({ length: 6 }, (_, i) => ({
    name: `Player ${i}`,
    studentId: `${prefix}${i}`,
    shirtNumber: i + 1,
    position: i === 0 ? "Goalkeeper" : "Defender",
  }));
test("roster validates limits goalkeeper shirt uniqueness and normalized identity", () => {
  assert.equal(validatePlayers(roster(" a "))[0].studentId, "A 0");
  assert.throws(() => validatePlayers(roster("a").slice(0, 5)));
  assert.throws(() =>
    validatePlayers(roster("a").map((p) => ({ ...p, position: "Forward" }))),
  );
  const r = roster("a");
  r[1].studentId = " A0 ";
  assert.throws(() => validatePlayers(r));
  const s = roster("a");
  s[1].shirtNumber = 1;
  assert.throws(() => validatePlayers(s));
});
test("approval reserves IDs atomically and private data stays off public roster", async () => {
  const db = openDatabase(":memory:");
  const app = createApp(db, { demo: true });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${(server.address() as any).port}/api`;
  let h: any = {};
  async function call(path: string, method = "GET", body?: unknown) {
    const r = await fetch(base + path, {
      method,
      headers: { "content-type": "application/json", ...h },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: r.status,
      data: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  }
  try {
    const o = await call("/auth/demo", "POST", { role: "organizer" });
    h = { cookie: o.cookie, "x-csrf-token": o.data.csrf };
    const t = await call("/tournaments", "POST", {
      name: "Cup",
      startDate: "2026-10-13",
    });
    const c = await call("/auth/demo", "POST", { role: "captain" });
    h = { cookie: c.cookie, "x-csrf-token": c.data.csrf };
    const a = await call(`/tournaments/${t.data.id}/applications`, "POST", {
      teamName: "Team A",
      captainName: "Captain",
      captainContact: "private-contact",
      players: roster("secret-"),
    });
    assert.equal(a.status, 201);
    assert.equal(
      (
        await call(
          `/tournaments/${t.data.id}/applications/${a.data.id}/review`,
          "POST",
          { status: "accepted" },
        )
      ).status,
      403,
    );
    h = { cookie: o.cookie, "x-csrf-token": o.data.csrf };
    assert.equal(
      (
        await call(
          `/tournaments/${t.data.id}/applications/${a.data.id}/review`,
          "POST",
          { status: "accepted" },
        )
      ).status,
      200,
    );
    db.prepare(
      "INSERT INTO applications(id,tournament_id,captain_id,team_name,captain_name,captain_contact) VALUES(?,?,?,?,?,?)",
    ).run("b", t.data.id, "demo-captain", "Team B", "C", "private");
    for (let i = 0; i < 6; i++)
      db.prepare("INSERT INTO players VALUES(?,?,?,?,?,?,?)").run(
        "b" + i,
        t.data.id,
        "b",
        "Player",
        "SECRET-" + i,
        i + 1,
        i === 0 ? "Goalkeeper" : "Forward",
      );
    assert.equal(
      (
        await call(`/tournaments/${t.data.id}/applications/b/review`, "POST", {
          status: "accepted",
        })
      ).status,
      400,
    );
    assert.equal(
      db.prepare("SELECT status FROM applications WHERE id=?").get("b")?.status,
      "pending",
    );
    assert.equal(db.prepare("SELECT COUNT(*) n FROM memberships").get()?.n, 6);
    h = {};
    const pub = JSON.stringify((await call("/tournaments/" + t.data.id)).data);
    assert.ok(!pub.includes("SECRET-"));
    assert.ok(!pub.includes("private-contact"));
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
  }
});
