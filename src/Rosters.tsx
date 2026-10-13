import React, { useEffect, useState } from "react";
export function Rosters({
  tournament: t,
  user,
  csrf,
  onChange,
}: {
  tournament: any;
  user: any;
  csrf: string;
  onChange: () => void;
}) {
  const [apps, setApps] = useState<any[]>([]),
    [requests, setRequests] = useState<any[]>([]),
    [removes, setRemoves] = useState<string[]>([]),
    [replacements, setReplacements] = useState<any[]>([]),
    [error, setError] = useState("");
  async function call(path: string, body?: unknown) {
    const r = await fetch("/api/tournaments/" + t.id + path, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: body ? JSON.stringify(body) : undefined,
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    return d;
  }
  async function load() {
    try {
      setApps(await call("/applications"));
      setRequests(await call("/roster-requests"));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    if (user) load();
  }, [t.id, user?.id, t.window_state]);
  if (!user || t.status === "registration") return null;
  const team = apps.find(
    (a) => a.status === "accepted" && a.captain_id === user.id,
  );
  async function act(path: string, body: any) {
    setError("");
    try {
      await call(path, body);
      setRemoves([]);
      setReplacements([]);
      await load();
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="panel">
      <h2>Midseason roster window</h2>
      <p>
        Window:{" "}
        <strong>
          {t.window_state === "not_opened" ? "Not opened yet" : t.window_state}
        </strong>
        . Existing teams may remove players or replace them. Historical
        participation and goals remain.
      </p>
      {error && <p className="error">{error}</p>}
      {t.canManage && t.status === "ongoing" && t.window_state !== "closed" && (
        <button
          onClick={() =>
            act("/roster-window", { open: t.window_state !== "open" })
          }
        >
          {t.window_state === "open"
            ? "Close replacement window"
            : "Open replacement window"}
        </button>
      )}
      {team && t.window_state === "open" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            act("/roster-requests", {
              applicationId: team.id,
              removeIds: removes,
              replacements,
            });
          }}
        >
          <h3>Select players to remove</h3>
          {team.players
            .filter((p: any) => p.active)
            .map((p: any) => (
              <label className="check" key={p.id}>
                <input
                  type="checkbox"
                  checked={removes.includes(p.id)}
                  onChange={(e) =>
                    setRemoves(
                      e.target.checked
                        ? [...removes, p.id]
                        : removes.filter((x) => x !== p.id),
                    )
                  }
                />
                {p.shirt_number} · {p.name}
              </label>
            ))}
          <h3>Replacement players</h3>
          {replacements.map((p, i) => (
            <div className="player-row" key={i}>
              {[
                ["name", "Name"],
                ["studentId", "Student ID"],
                ["shirtNumber", "Shirt number"],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    required
                    type={key === "shirtNumber" ? "number" : "text"}
                    min={1}
                    max={99}
                    value={p[key]}
                    onChange={(e) =>
                      setReplacements(
                        replacements.map((x, j) =>
                          j === i
                            ? {
                                ...x,
                                [key]:
                                  key === "shirtNumber"
                                    ? Number(e.target.value)
                                    : e.target.value,
                              }
                            : x,
                        ),
                      )
                    }
                  />
                </label>
              ))}
              <label>
                Position
                <select
                  value={p.position}
                  onChange={(e) =>
                    setReplacements(
                      replacements.map((x, j) =>
                        j === i ? { ...x, position: e.target.value } : x,
                      ),
                    )
                  }
                >
                  {["Goalkeeper", "Defender", "Midfielder", "Forward"].map(
                    (x) => (
                      <option key={x}>{x}</option>
                    ),
                  )}
                </select>
              </label>
              <button
                type="button"
                onClick={() =>
                  setReplacements(replacements.filter((_, j) => j !== i))
                }
              >
                Remove
              </button>
            </div>
          ))}
          <div className="actions">
            <button
              type="button"
              disabled={replacements.length >= removes.length}
              onClick={() =>
                setReplacements([
                  ...replacements,
                  {
                    name: "",
                    studentId: "",
                    shirtNumber: 1,
                    position: "Defender",
                  },
                ])
              }
            >
              Add replacement
            </button>
            <button className="primary" disabled={!removes.length}>
              Submit changes for approval
            </button>
          </div>
        </form>
      )}
      {requests.map((r) => (
        <article className="application" key={r.id}>
          <span className="status">{r.status}</span>
          <h3>{r.team_name}</h3>
          <p>
            Remove {r.changes.removeIds.length} players · Replace{" "}
            {r.changes.replacements.length} players
          </p>
          {r.changes.replacements.map((p: any, i: number) => (
            <p key={i}>
              {p.name} · {p.studentId} (private) · #{p.shirtNumber} ·{" "}
              {p.position}
            </p>
          ))}
          {t.canManage &&
            r.status === "pending" &&
            t.window_state === "open" && (
              <div className="actions">
                <button
                  className="primary"
                  onClick={() =>
                    act("/roster-requests/" + r.id + "/review", {
                      status: "accepted",
                    })
                  }
                >
                  Approve changes
                </button>
                <button
                  onClick={() =>
                    act("/roster-requests/" + r.id + "/review", {
                      status: "rejected",
                    })
                  }
                >
                  Reject changes
                </button>
              </div>
            )}
        </article>
      ))}
    </section>
  );
}
