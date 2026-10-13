# Proposed implementation task queue

These are local PM task proposals, not real GitHub Issues. Each must be expanded into a detailed issue with acceptance criteria, tests, dependencies, and verified completion evidence. Product source: `plan.md`. GitHub issue URLs and actual status must be recorded only after creation. Goal/Description format follows the reviewed article's task decomposition; inaccessible example issue is not claimed reproduced exactly.

## TT-01 — Establish persistence and application foundation

**Goal:** Run a maintainable application with server persistence and repeatable setup.

**Description:** Select/document architecture; initialize frontend and server; define tournament, account, applications, team/player identities, membership history, fixtures, result and goal storage; implement migration/setup and test infrastructure. Verify restart persistence and build. Dependencies: architecture decision.

## TT-02 — Implement Google authentication and scoped authorization

**Goal:** Authenticate captains and restrict organizer actions to preassigned tournament owners.

**Description:** Configure real Google OAuth, authenticated sessions, organizer provisioning, ownership enforcement and sign-out. Document required credentials and verify unauthenticated/unauthorized failures. Public responses must never expose contact/Student ID fields. Dependencies: TT-01, Google configuration.

## TT-03 — Implement tournament creation and public tournament discovery

**Goal:** Organizers create tournaments that spectators can follow.

**Description:** Provide organizer-owned creation/editing and public directory/detail; validate metadata, expose tournament lifecycle/progress, and build restrained English red/blue navigation with loading, empty and error states. Dependencies: TT-01, TT-02.

## TT-04 — Implement captain applications and organizer decisions

**Goal:** Accept eligible six-a-side teams through reviewed applications.

**Description:** Capture captain name/contact and 6–13 players with Student IDs, numbers, names and positions, including one goalkeeper; validate eligibility, show private captain/owner views, approve/reject applications, and expose public roster projections. Verify concurrent duplicate eligibility checks at approval. Dependencies: TT-02, TT-03.

## TT-05 — Generate round-robin fixtures and schedule matches

**Goal:** Every accepted team pair plays exactly once with organizer-controlled scheduling.

**Description:** Generate round pairings for odd/even team counts, lock team set, prevent duplicate regeneration, support date/time/venue edits and public fixture views. Define documented scheduling limitations. Dependencies: TT-04.

## TT-06 — Record results, goals and automatic standings

**Goal:** Correctly derive standings and scorer statistics from organizer-entered results.

**Description:** Enter/update finished scores and goal events; account for own goals, reject invalid numbers/membership, calculate 3/1/0 standings with approved tie criteria/shared rank, preserve history and automatically complete all-finished tournaments. Tests must include corrections, own goals and tied champions. Dependencies: TT-05.

## TT-07 — Implement reviewed midseason roster replacements

**Goal:** Change players through a manually controlled second window without losing history.

**Description:** Document midpoint interpretation; owner opens/closes window; captain submits removals/replacements, owner approves/rejects; atomic final-roster and whole-tournament eligibility checks; maintain past scorers and roster membership. Test no new team entry and no standalone roster growth. Dependencies: TT-04, TT-05, TT-06.

## TT-08 — Verify user journeys, responsive UI and submission evidence

**Goal:** Provide a verified application and honest assignment evidence before deadline.

**Description:** Independently test spectator/captain/owner flows, authorization, privacy, persistence, fixture correctness, result correction, scorers, roster history and completion. Fix failures; document executed commands/results, screenshots, setup, limitations and issue-to-commit traceability. Close actual issues only after verification and publish actual repository URL. Dependencies: TT-01 through TT-07.
