# Tournament Tracker

An English university football application for 6v6 single round robin competitions. Captains apply with 6–13 players; designated organizers approve teams, generate fixtures, schedule matches and record results. Spectators follow public rosters, standings and scorers without signing in. A manually opened midseason window supports approved removals/replacements, preserving history.

## Quick start

Requires Node.js 24+ and npm. Clone the repository and run:

```sh
npm ci
cp .env.example .env
npm run build
npm start
```

Open http://localhost:3001. The Express server serves the built frontend and API on the same origin. Set PORT to change it. SQLite persists in `data/tournament-tracker.sqlite`; set DATABASE_PATH to an absolute durable path when hosting. Deleting the database removes local records. No hosting deployment has been performed.

For development, run `npm run dev:server` and `npm run dev` in separate terminals, then open http://127.0.0.1:5173. Vite proxies `/api` to the server. Run `npm test` and `npm run build` for verification. Production build and CI use the committed dependency lockfile.

## Google sign-in and demo

Follow [_docs/google-setup.md](_docs/google-setup.md) to create a Google Cloud project, configure the web OAuth client and add its public GOOGLE_CLIENT_ID to `.env`. Preassign organizer emails using ORGANIZER_EMAILS; all other verified accounts become captains. Google Identity Services tokens are verified by the server, with single-use nonce, secure production session cookies, expiry and CSRF protection.

**Live Google authentication has not been verified.** Google Cloud was unavailable during setup and credentials have not been provisioned. Automated auth tests inject a verifier and do not replace a real provider test. TT-02 remains blocked on configured live verification.

For a local demonstration only, set DEMO_MODE=true and NODE_ENV=development. The UI explicitly labels fictional demo organizer/captain accounts. Demo sign-in is unavailable in production. These accounts share one local demo identity per role; separate real captains require Google setup. Never use real student records in a public demo. No secrets or database files are committed.

## Workflows

1. Sign in as a preassigned organizer and create a tournament with name, description and venue.
2. Captains submit team name, captain contact and 6–13 players, including a goalkeeper. Each player supplies name, Student ID, unique shirt number 1–99 and position.
3. Organizer accepts/rejects applications. Student IDs are reserved to exactly one team for that tournament, including removed players. Public responses exclude Student IDs and captain contacts.
4. Generate the single round robin from at least two accepted teams. Team admissions close. Assign kickoff times and venues.
5. Enter each score and matching goal events. Own goals credit the opponent and do not add scorer goals. Corrections replace previous events and recompute tables. Wins/draws/losses score 3/1/0; points, GD and GF determine positions; exact ties share competition ranks and champions.
6. After at least half the generated matches finish, open the second roster window manually. Captains propose removals and at most one replacement per removal. Organizer approval atomically enforces the final roster and preserves past match eligibility. Close the window once finished; it cannot reopen.
7. The tournament completes once every fixture is finished.

## Implementation and limitations

Match history uses membership at scheduled kickoff; unscheduled matches use first-result time. Result corrections preserve immutable snapshots. Times store UTC and display in the viewer's local timezone. Scheduling prevents exact same kickoff collisions for a team/venue within one tournament; match durations, rest intervals and cross-tournament venue allocation are not modeled. No cards, forfeits, live commentary, payments, team transfers or knockout bracket support.

Privacy controls are server projections and authorization checks, not hidden UI elements. Owner authorization is scoped to each tournament. SQLite is durable server storage; native synchronous SQLite is suitable for this small application, with serialized writes. High-volume production rollout requires separate operational review.

## AI-native assignment evidence

Real discovery: [chat-brainstorm.md](chat-brainstorm.md). Specifications: [_docs/plan.md](_docs/plan.md). Agent instructions: [AGENTS.md](AGENTS.md). Workflow: [_docs/process.md](_docs/process.md), role files in `_docs/team/`, specifications in `_docs/issues/`, and independent checks in `_docs/qa/` where recorded. Read [_docs/implementation.md](_docs/implementation.md) for commit mapping. Local commits and GitHub browser-upload commits have different hashes; neither is represented as the other.

The article was reviewed; its video and example issue were initially unavailable and remain unverified unless later evidence says otherwise. Missing provider verification and assignment evidence are documented honestly; this repository does not assert complete fulfillment of every grading criterion.
