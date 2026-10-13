# Tournament Tracker — product specification

## Source and status

Product discovery is evidenced by `../chat-brainstorm.md`, with the original assignment in `assignment.md`. User-confirmed requirements below override initial suggestions in the assignment. This document is a product specification, not a claim of implementation or test success. Article review was reported complete in the visible session; video and example issue are still unverified. Deadline: 2026-10-13 14:20 UTC+5 / 09:20 UTC.

## Product goal

Provide a central English-language application for university football tournaments, replacing scattered registration, match schedules, score records, and manual standings with a persistent shared source of truth.

## Approved MVP

| Area | Approved requirement |
| --- | --- |
| Competition | University football; 6v6, five outfield players and one goalkeeper |
| Format | Single round robin: every pair of accepted teams plays once |
| Authentication | Google sign-in for captains and organizers |
| Organizers | Only preassigned organizers create tournaments; each manages their own tournaments |
| Spectators | No sign-in required to view tournament information, schedules, results, public rosters and standings |
| Registration | Captains submit team applications; organizer accepts or rejects |
| Application | Captain name/contact, team name, players' names, Student IDs, shirt numbers and positions |
| Privacy | Student IDs and captain contacts available only to the captain and the tournament organizer; omit from public API responses |
| Roster | 6–13 active players, at least one goalkeeper; same constraints after changes |
| Eligibility | Student ID can belong to only one team throughout a tournament, even after removal; independent tournaments may reuse the same ID |
| Fixtures | Generate pairings automatically; organizer sets dates, times and venue |
| Scoring | Organizer alone enters and edits scores and goalscorers |
| Points | Win 3, draw 1, loss 0 |
| Standings | Played, wins, draws, losses, goals for/against, goal difference and points; descending points, goal difference, goals scored; exact ties share rank, including first place |
| Scorers | Track goal authors and leaderboard; own goals count for the opponent's team score and do not increase the player's goalscorer tally |
| Midseason changes | Organizer manually opens/closes second window after midpoint; captains submit removals/replacements only; organizer approval required; no new teams |
| History | Preserve removed players' previous participation and goal records |
| Completion | Tournament completes once every generated match is finished |
| Persistence | Server-side data, available across devices |
| Presentation | Minimalist English UI, neutral background, restrained red/blue accents; neither excessively bright nor dull |

## User journeys

A spectator opens the tournament directory and follows schedules, results, standings, team rosters and scorers. A captain signs in with Google, submits a complete valid team application and views its status. The organizer reviews applications, generates fixtures from accepted teams, assigns dates and venues, records results and corrects mistakes. Standings/scorers refresh from persisted results. After midpoint the organizer opens the roster window; the captain proposes removals/replacements and the organizer approves a valid resulting roster. Once all matches finish, the tournament is complete and may have shared winners.

## Permissions and invariants

All mutation permissions must be enforced by the server, not only hidden UI controls. Organizer access is scoped to ownership. A captain cannot approve their own application or roster changes. Private fields must be excluded from spectator payloads rather than hidden by CSS. Rejected or pending applications do not enter generated fixtures. Goal histories must refer to stable player identities; removing roster membership must not delete those identities or history. Standings derive from finished match results and must recalculate on corrections without accumulating duplicates.

## Proposed implementation safeguards (not additional user approvals)

- Require at least two accepted teams before fixture generation; prevent repeated generation from creating duplicates.
- Use nonnegative integer scores and validate that recorded goal events reconcile with each team's total, including own goals.
- Validate scorer membership at the time of the match, not only current roster membership.
- Reject duplicate normalized Student IDs within one application and tournament. Decide a documented normalization policy rather than silently merging unrelated IDs.
- Validate unique shirt numbers within each active team roster. This correctness convention was not separately discussed with the user.
- Approve replacements atomically: validate the final roster, then persist it; pending changes leave the current roster intact.
- Retain sufficient membership history to allow earlier result corrections after replacements.
- Reject overlapping fixture times for the same team or venue, if time-slot duration is modeled; otherwise clearly document the limitation.

## Pending technical decisions

The implementation owner selected and implemented the foundation with React/TypeScript/Vite, Node.js/Express and SQLite; see `architecture.md` for actual versions and tradeoffs. This is an engineering selection, not a claimed separate user approval. The public repository is https://github.com/mjesenuly/tournament-tracker and real issues 1–8 exist. Google client credentials, callback configuration, organizer provisioning and hosting remain configuration work. The user requested Google sign-in setup from zero; the observed Google Cloud console surface returned Site Unavailable. Real OAuth cannot be claimed operational until configured and exercised. A demo path, if provided, must be clearly labeled and must not masquerade as Google sign-in. Local storage alone cannot satisfy the approved server persistence requirement.

## Product edges requiring an explicit documented interpretation

1. Midpoint: elapsed calendar time, completed rounds, or completed match count was not defined. Suggested deterministic interpretation: finished matches >= ceiling(total generated matches / 2), opening allowed only while tournament ongoing. The manual opening decision itself is approved.
2. No minimum rest period, match duration, timezone display policy or venue conflict interval was specified.
3. Captain contact format (phone, email or both), Student ID format, permitted positions and shirt-number range were not specified. Faculty was suggested but not selected by the user; it is not mandatory.
4. Behavior when a captain removes a player without replacement is allowed as long as the resulting roster still meets 6–13 and goalkeeper constraints. Increasing roster through standalone additions in the second window is outside approved scope.
5. Whether organizers may reopen the second window repeatedly, edit finalized fixtures or withdraw accepted teams after generation was not discussed. Safe initial policy: no team-set changes after fixtures exist; at most one second registration phase, while allowing organizer scheduling corrections.
6. Whether one captain can submit multiple teams, whether rejected applications can be resubmitted, and whether captains may edit pending applications was not discussed.
7. Shared rank numbering (e.g. 1,1,3 versus 1,1,2) was not specified; proposed competition ranking is 1,1,3.
8. Forfeits, abandoned matches, disciplinary cards and penalties are outside MVP unless later approved.

## Success criteria

A real authenticated captain and preassigned organizer can perform their distinct workflows against persistent server data. Round robin is complete for odd and even team counts, results and corrections update standings/scorers, private identifiers never appear in public responses, unauthorized writes fail, valid replacements preserve history, and all-finished fixtures complete the tournament. Responsive UI and meaningful automated workflow/security tests provide review evidence. Final repository documentation must reflect actual implementation and distinguish unavailable integrations from completed work.

## Out of scope

Knockout brackets, esports, individual competitions, live match commentary, payments, chat, disciplinary systems, arbitrary team entry after fixture generation, and automatic midseason opening.
