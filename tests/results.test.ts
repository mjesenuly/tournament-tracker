import test from "node:test";
import assert from "node:assert/strict";
import { standings, tournamentStats } from "../server/results.js";
import { createApp } from "../server/app.js";
import { openDatabase } from "../server/db.js";
test("standings wins draws points goal difference exact shared ranks recompute", () => {
  const teams = ["a", "b", "c"].map((id) => ({ id, team_name: id }));
  const f = [
    {
      home_id: "a",
      away_id: "b",
      status: "finished",
      home_score: 2,
      away_score: 0,
    },
    {
      home_id: "a",
      away_id: "c",
      status: "finished",
      home_score: 1,
      away_score: 1,
    },
  ];
  const table = standings(teams, f);
  assert.equal(table[0].points, 4);
  assert.equal(table[0].gd, 2);
  assert.equal(table[0].played, 2);
  f[0].home_score = 0;
  assert.equal(standings(teams, f)[0].points, 2);
  assert.deepEqual(
    standings(teams, []).map((r) => r.rank),
    [1, 1, 1],
  );
  const tied = standings(teams, [
    {
      home_id: "a",
      away_id: "c",
      status: "finished",
      home_score: 1,
      away_score: 0,
    },
    {
      home_id: "b",
      away_id: "c",
      status: "finished",
      home_score: 1,
      away_score: 0,
    },
  ]);
  assert.deepEqual(
    tied.map((r) => r.rank),
    [1, 1, 3],
  );
});
test("own goal correction preserves snapshot and automatically completes without duplicate statistics", async () => {
  const db = openDatabase(":memory:");
  const app = createApp(db, { demo: true });
  db.prepare("INSERT INTO users VALUES(?,?,?,?,?)").run(
    "demo-organizer",
    null,
    "organizer@demo.invalid",
    "Demo organizer",
    "organizer",
  );
  db.prepare(
    "INSERT INTO tournaments(id,organizer_id,name,status) VALUES(?,?,?,?)",
  ).run("t", "demo-organizer", "Cup", "ongoing");
  for (const team of ["a", "b"]) {
    db.prepare("INSERT INTO applications VALUES(?,?,?,?,?,?,?)").run(
      team,
      "t",
      "demo-organizer",
      team,
      "Captain",
      "private",
      "accepted",
    );
    db.prepare("INSERT INTO players VALUES(?,?,?,?,?,?,?)").run(
      "p" + team,
      "t",
      team,
      "Player " + team,
      "secret" + team,
      1,
      "Forward",
    );
    db.prepare(
      "INSERT INTO memberships(player_id,application_id) VALUES(?,?)",
    ).run("p" + team, team);
  }
  db.prepare(
    "INSERT INTO fixtures(id,tournament_id,home_id,away_id,round) VALUES(?,?,?,?,?)",
  ).run("f", "t", "a", "b", 1);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${(server.address() as any).port}/api`;
  const login = await fetch(base + "/auth/demo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role: "organizer" }),
  });
  const session = (await login.json()) as any;
  const headers = {
    "content-type": "application/json",
    cookie: login.headers.get("set-cookie")!.split(";")[0],
    "x-csrf-token": session.csrf,
  };
  const save = async (body: any) =>
    fetch(base + "/tournaments/t/fixtures/f/result", {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
  try {
    assert.equal(
      (await save({ homeScore: 1, awayScore: 0, goals: [] })).status,
      400,
    );
    assert.equal(
      (
        await save({
          homeScore: 1,
          awayScore: 0,
          goals: [{ playerId: "missing", ownGoal: false }],
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await save({
          homeScore: 1,
          awayScore: 0,
          goals: [{ playerId: "pb", ownGoal: true }],
        })
      ).status,
      200,
    );
    assert.equal(tournamentStats(db, "t").scorers.length, 0);
    assert.equal(
      db.prepare("SELECT status FROM tournaments WHERE id=?").get("t")?.status,
      "completed",
    );
    db.prepare(
      "UPDATE memberships SET removed_at=CURRENT_TIMESTAMP WHERE player_id=?",
    ).run("pb");
    assert.equal(
      (
        await save({
          homeScore: 0,
          awayScore: 1,
          goals: [{ playerId: "pb", ownGoal: false }],
        })
      ).status,
      200,
    );
    const stats = tournamentStats(db, "t");
    assert.equal(stats.scorers[0].goals, 1);
    assert.equal(stats.standings[0].id, "b");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM goals").get()?.n, 1);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
  }
});
