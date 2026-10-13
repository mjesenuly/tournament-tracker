import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/app.js";
import { openDatabase } from "../server/db.js";
test("public discovery and server-side creation editing authorization", async () => {
  const db = openDatabase(":memory:");
  const app = createApp(db, { demo: true });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const address = server.address() as any;
  const base = `http://127.0.0.1:${address.port}/api`;
  const call = async (
    path: string,
    method = "GET",
    body?: unknown,
    headers: any = {},
  ) => {
    const r = await fetch(base + path, {
      method,
      headers: { "content-type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: r.status,
      data: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
    };
  };
  try {
    assert.equal(
      (
        await call("/tournaments", "POST", {
          name: "Cup",
          startDate: "2026-10-13",
        })
      ).status,
      401,
    );
    const captain = await call("/auth/demo", "POST", { role: "captain" });
    assert.equal(
      (
        await call(
          "/tournaments",
          "POST",
          { name: "Cup", startDate: "2026-10-13" },
          { cookie: captain.cookie, "x-csrf-token": captain.data.csrf },
        )
      ).status,
      403,
    );
    const organizer = await call("/auth/demo", "POST", { role: "organizer" });
    const h = { cookie: organizer.cookie, "x-csrf-token": organizer.data.csrf };
    assert.equal(
      (await call("/tournaments", "POST", { name: "x" }, h)).status,
      400,
    );
    assert.equal(
      (await call("/tournaments", "POST", { name: "Missing date" }, h)).status,
      400,
    );
    assert.equal(
      (
        await call(
          "/tournaments",
          "POST",
          { name: "Bad calendar", startDate: "2026-02-30" },
          h,
        )
      ).status,
      400,
    );
    const created = await call(
      "/tournaments",
      "POST",
      { name: "Campus Cup", startDate: "2026-10-13", venue: "Pitch A" },
      h,
    );
    assert.equal(created.status, 201);
    assert.equal((await call("/tournaments")).data.length, 1);
    const detail = await call("/tournaments/" + created.data.id);
    assert.equal(detail.data.canManage, false);
    assert.equal(detail.data.start_date, "2026-10-13");
    assert.ok(!JSON.stringify(detail.data).includes("captain_contact"));
    assert.equal(
      (
        await call(
          "/tournaments/" + created.data.id,
          "PATCH",
          { name: "Updated Cup", startDate: "2026-10-14" },
          h,
        )
      ).status,
      200,
    );
    assert.equal(
      (await call("/tournaments/" + created.data.id)).data.start_date,
      "2026-10-14",
    );
    assert.equal(
      (await call("/tournaments/" + created.data.id)).data.name,
      "Updated Cup",
    );
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
  }
});
