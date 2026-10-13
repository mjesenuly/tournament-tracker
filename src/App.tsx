import { Rosters } from "./Rosters";
import { Statistics } from "./Results";
import { Fixtures } from "./Fixtures";
import { Applications } from "./Applications";
import React, { useState, useEffect } from "react";
type User = { id: string; name: string; email: string; role: string };
type Tournament = {
  id: string;
  name: string;
  description: string;
  venue: string;
  status: string;
  team_count: number;
  match_count: number;
  finished_count: number;
  canManage?: boolean;
  teams?: any[];
  fixtures?: any[];
};
async function api(
  path: string,
  method = "GET",
  body?: unknown,
  csrf?: string,
) {
  const r = await fetch("/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "Request failed");
  return data;
}
export function App() {
  const [user, setUser] = useState<User | null>(null),
    [csrf, setCsrf] = useState(""),
    [config, setConfig] = useState<any>(null),
    [items, setItems] = useState<Tournament[]>([]),
    [selected, setSelected] = useState<Tournament | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [form, setForm] = useState(false),
    [busy, setBusy] = useState(false);
  const refresh = async (id?: string) => {
    setLoading(true);
    try {
      setItems(await api("/tournaments"));
      if (id) setSelected(await api("/tournaments/" + id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  const signedIn = (s: any) => {
    setUser(s.user);
    setCsrf(s.csrf || "");
    if (selected) refresh(selected.id);
  };
  useEffect(() => {
    refresh();
    api("/auth/me")
      .then(signedIn)
      .catch((e) => setError(e.message));
    api("/auth/config")
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!config?.clientId || user) return;
    let cancelled = false;
    const init = () => {
      if (cancelled) return;
      const g = (window as any).google;
      g.accounts.id.initialize({
        client_id: config.clientId,
        nonce: config.nonce,
        callback: async (r: any) => {
          try {
            signedIn(
              await api("/auth/google", "POST", {
                credential: r.credential,
                nonce: config.nonce,
              }),
            );
          } catch (e) {
            setError((e as Error).message);
            api("/auth/config").then(setConfig);
          }
        },
      });
      g.accounts.id.renderButton(document.getElementById("google-signin"), {
        theme: "outline",
        size: "large",
      });
    };
    if ((window as any).google) init();
    else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = init;
      document.head.append(script);
    }
    return () => {
      cancelled = true;
    };
  }, [config, user]);
  const open = async (id: string) => {
    setError("");
    setForm(false);
    await refresh(id);
  };
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await api(
        selected && form ? "/tournaments/" + selected.id : "/tournaments",
        selected && form ? "PATCH" : "POST",
        Object.fromEntries(f),
        csrf,
      );
      setForm(false);
      await open(r.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <header>
        <button
          className="brand"
          onClick={() => {
            setSelected(null);
            setForm(false);
            refresh();
          }}
        >
          <span className="mark">T</span>Tournament Tracker
        </button>
        <div className="account">
          {user ? (
            <>
              <span>
                {user.name}
                <small>{user.role}</small>
              </span>
              <button
                onClick={async () => {
                  try {
                    await api("/auth/logout", "POST", {}, csrf);
                    signedIn({ user: null });
                    api("/auth/config").then(setConfig);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <div id="google-signin" />
          )}
        </div>
      </header>
      <main>
        {config?.demo && (
          <aside className="demo">
            <strong>Local demonstration · fictional accounts</strong>
            <button
              onClick={() =>
                api("/auth/demo", "POST", { role: "captain" })
                  .then(signedIn)
                  .catch((e) => setError(e.message))
              }
            >
              Demo captain
            </button>
            <button
              onClick={() =>
                api("/auth/demo", "POST", { role: "organizer" })
                  .then(signedIn)
                  .catch((e) => setError(e.message))
              }
            >
              Demo organizer
            </button>
          </aside>
        )}
        {!config?.clientId && !user && (
          <aside>
            Google sign-in awaits administrator configuration. Public tournament
            browsing is available.
          </aside>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
            <button onClick={() => setError("")}>Dismiss</button>
          </div>
        )}
        <div className="heading">
          <div>
            <span className="eyebrow">UNIVERSITY FOOTBALL · 6V6</span>
            <h1>{selected ? selected.name : "Every team. Every match."}</h1>
            <p>
              {selected
                ? selected.description
                : "Follow your campus competition, from registration to the final whistle."}
            </p>
          </div>
          {user?.role === "organizer" && !selected && (
            <button className="primary" onClick={() => setForm(!form)}>
              Create tournament
            </button>
          )}
          {selected?.canManage && (
            <button onClick={() => setForm(!form)}>Edit details</button>
          )}
        </div>
        {form && (
          <form onSubmit={submit} className="panel">
            <h2>{selected ? "Edit tournament" : "New tournament"}</h2>
            <label>
              Tournament name
              <input
                name="name"
                required
                minLength={3}
                maxLength={100}
                defaultValue={selected?.name}
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                maxLength={1000}
                defaultValue={selected?.description}
              />
            </label>
            <label>
              Default venue
              <input
                name="venue"
                maxLength={150}
                defaultValue={selected?.venue}
              />
            </label>
            <p className="muted">
              Single round robin · 5 outfield players + 1 goalkeeper
            </p>
            <button className="primary" disabled={busy}>
              {busy ? "Saving…" : "Save tournament"}
            </button>
          </form>
        )}
        {loading ? (
          <div className="panel" role="status">
            Loading tournaments…
          </div>
        ) : selected ? (
          <>
            <button
              className="back"
              onClick={() => {
                setSelected(null);
                setForm(false);
              }}
            >
              ← All tournaments
            </button>
            <div className="stats">
              <div>
                <strong>{selected.team_count}</strong>
                <span>Accepted teams</span>
              </div>
              <div>
                <strong>
                  {selected.finished_count} / {selected.match_count}
                </strong>
                <span>Matches completed</span>
              </div>
              <div>
                <strong>{selected.status}</strong>
                <span>Tournament phase</span>
              </div>
            </div>
            <Statistics tournament={selected} />
            <Fixtures
              tournament={selected}
              csrf={csrf}
              onChange={() => refresh(selected.id)}
            />
            <Rosters
              tournament={selected}
              user={user}
              csrf={csrf}
              onChange={() => refresh(selected.id)}
            />
            <Applications
              tournament={selected}
              user={user}
              csrf={csrf}
              onChange={() => refresh(selected.id)}
            />
            <section className="panel">
              <h2>Teams</h2>
              {selected.teams?.length ? (
                selected.teams.map((t) => (
                  <article key={t.id}>
                    <h3>{t.name}</h3>
                    <p>
                      {t.players
                        .map(
                          (p: any) =>
                            `${p.shirtNumber} · ${p.name} (${p.position})`,
                        )
                        .join(", ")}
                    </p>
                  </article>
                ))
              ) : (
                <p>No accepted teams yet.</p>
              )}
            </section>
          </>
        ) : (
          <div className="cards">
            {items.length ? (
              items.map((t) => (
                <button className="card" key={t.id} onClick={() => open(t.id)}>
                  <span className={"status " + t.status}>{t.status}</span>
                  <h2>{t.name}</h2>
                  <p>{t.description || "University football tournament"}</p>
                  <div>
                    {t.team_count} teams <span>·</span> {t.finished_count}/
                    {t.match_count} matches
                  </div>
                  <small>{t.venue || "Venue to be announced"}</small>
                  <span className="card-link">View tournament →</span>
                </button>
              ))
            ) : (
              <section className="panel">
                <h2>A new season starts here</h2>
                <p>
                  No tournaments have been created. A designated organizer can
                  create the first competition.
                </p>
              </section>
            )}
          </div>
        )}
        <footer>Campus football, together. · Tournament Tracker</footer>
      </main>
    </>
  );
}
