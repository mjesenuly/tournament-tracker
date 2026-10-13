import { ResultEditor } from "./Results";
import React, { useState } from "react";
export function Fixtures({
  tournament,
  csrf,
  onChange,
}: {
  tournament: any;
  csrf: string;
  onChange: () => void;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function call(path: string, body?: unknown, method = "POST") {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(
        "/api/tournaments/" + tournament.id + "/fixtures" + path,
        {
          method,
          headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
          body: JSON.stringify(body || {}),
        },
      );
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Match schedule & results</h2>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {tournament.canManage && tournament.status === "registration" && (
        <>
          <p>
            Generate the single round robin after accepting all teams.
            Registration then closes.
          </p>
          <button
            className="primary"
            disabled={busy || tournament.team_count < 2}
            onClick={() => call("/generate")}
          >
            Generate fixtures
          </button>
        </>
      )}
      {tournament.fixtures?.length ? (
        tournament.fixtures.map((f: any) => (
          <div className="fixture" key={f.id}>
            <div className="match">
              <span>
                <small>ROUND {f.round}</small>
                <br />
                {f.home_name}{" "}
                <b>
                  {f.status === "finished"
                    ? `${f.home_score} – ${f.away_score}`
                    : "vs"}
                </b>{" "}
                {f.away_name}
              </span>
              <small>
                {f.scheduled_at
                  ? new Date(f.scheduled_at).toLocaleString()
                  : "Date to be confirmed"}{" "}
                · {f.venue || "Venue to be confirmed"}
              </small>
            </div>
            {tournament.canManage && (
              <form
                className="schedule"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  call(
                    "/" + f.id,
                    {
                      scheduledAt: new Date(
                        String(data.get("time")),
                      ).toISOString(),
                      venue: data.get("venue"),
                    },
                    "PATCH",
                  );
                }}
              >
                <label>
                  Kickoff (your local timezone)
                  <input
                    type="datetime-local"
                    name="time"
                    required
                    defaultValue={
                      f.scheduled_at
                        ? new Date(
                            new Date(f.scheduled_at).getTime() -
                              new Date(f.scheduled_at).getTimezoneOffset() *
                                60000,
                          )
                            .toISOString()
                            .slice(0, 16)
                        : ""
                    }
                  />
                </label>
                <label>
                  Venue
                  <input
                    name="venue"
                    required
                    maxLength={150}
                    defaultValue={f.venue || tournament.venue}
                  />
                </label>
                <button disabled={busy}>Save schedule</button>
              </form>
            )}
            {tournament.canManage && (
              <ResultEditor
                fixture={f}
                tournamentId={tournament.id}
                csrf={csrf}
                onChange={onChange}
              />
            )}
          </div>
        ))
      ) : (
        <p>Fixtures will appear after the organizer generates the schedule.</p>
      )}
    </section>
  );
}
