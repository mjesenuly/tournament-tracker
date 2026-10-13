import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:5173",
});
Object.defineProperty(globalThis, "window", {
  value: dom.window,
  configurable: true,
});
Object.defineProperty(globalThis, "document", {
  value: dom.window.document,
  configurable: true,
});
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
Object.defineProperty(globalThis, "HTMLElement", {
  value: dom.window.HTMLElement,
  configurable: true,
});
Object.defineProperty(globalThis, "FormData", {
  value: dom.window.FormData,
  configurable: true,
});
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const React = await import("react");
const { render, screen, waitFor, cleanup } =
  await import("@testing-library/react");
const userEvent = (await import("@testing-library/user-event")).default;
const { App } = await import("../src/App.js");
const cup = {
  id: "cup",
  name: "Campus Cup",
  description: "Football on campus",
  venue: "Pitch A",
  status: "registration",
  team_count: 0,
  match_count: 0,
  finished_count: 0,
  teams: [],
  fixtures: [],
  standings: [],
  scorers: [],
  champions: [],
  window_state: "not_opened",
};
function mock(role?: string, fail = false) {
  const calls: any[] = [];
  globalThis.fetch = (async (url: any, options: any = {}) => {
    const path = String(url).replace("/api", "");
    calls.push({ path, ...options });
    let data: any;
    if (path === "/auth/config") data = { clientId: null, demo: false };
    else if (path === "/auth/me")
      data = {
        user: role
          ? { id: "user", role, name: "Test User", email: "test@demo.invalid" }
          : null,
        csrf: "token",
      };
    else if (path === "/tournaments" && options.method === "POST")
      data = { id: "cup" };
    else if (path === "/tournaments") data = [cup];
    else if (path === "/tournaments/cup")
      data = { ...cup, canManage: role === "organizer" };
    else if (path.endsWith("/applications")) data = [];
    else data = {};
    return {
      ok: !fail,
      status: fail ? 500 : 200,
      json: async () => (fail ? { error: "Server unavailable" } : data),
    } as Response;
  }) as typeof fetch;
  return calls;
}
test("public directory navigation and captain roster controls", async () => {
  mock("captain");
  const u = userEvent.setup();
  render(React.createElement(App));
  await screen.findByText("Campus Cup");
  await u.click(screen.getByRole("button", { name: /View tournament/ }));
  await screen.findByText("Match schedule & results");
  await u.click(screen.getByRole("button", { name: "Apply with a team" }));
  assert.equal(screen.getAllByLabelText("Student ID").length, 6);
  assert.ok(
    screen.getByText(
      "6–13 players, including at least one goalkeeper. Student IDs and captain contacts are private.",
    ),
  );
  await u.click(screen.getByRole("button", { name: "Add player" }));
  assert.equal(screen.getAllByLabelText("Student ID").length, 7);
  await u.click(screen.getByRole("button", { name: "← All tournaments" }));
  await screen.findByText("Every team. Every match.");
  cleanup();
});
test("organizer creates tournament with CSRF and required metadata", async () => {
  const calls = mock("organizer");
  const u = userEvent.setup();
  render(React.createElement(App));
  await screen.findByRole("button", { name: "Create tournament" });
  await u.click(screen.getByRole("button", { name: "Create tournament" }));
  await u.type(screen.getByLabelText("Tournament name"), "Fresh Cup");
  await u.type(screen.getByLabelText("Default venue"), "Pitch B");
  await u.click(screen.getByRole("button", { name: "Save tournament" }));
  await waitFor(() =>
    assert.ok(
      calls.find((c) => c.path === "/tournaments" && c.method === "POST"),
    ),
  );
  const created = calls.find(
    (c) => c.path === "/tournaments" && c.method === "POST",
  );
  assert.equal(created.headers["X-CSRF-Token"], "token");
  assert.equal(JSON.parse(created.body).name, "Fresh Cup");
  cleanup();
});
test("server errors have visible feedback", async () => {
  mock(undefined, true);
  render(React.createElement(App));
  await screen.findByRole("alert");
  assert.ok(screen.getByText("Server unavailable"));
  cleanup();
});
