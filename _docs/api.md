# HTTP API

All routes are under `/api`. JSON requests use Content-Type: application/json. Session cookies are HttpOnly. Mutations after authentication require X-CSRF-Token from `/auth/me` or the login response. Errors return an error message; unauthorized requests return 401/403. Public routes never include Student IDs or captain contacts.

| Method | Path | Access / purpose |
|---|---|---|
| GET | /health | Public database health |
| GET | /auth/config | Public GIS client ID, single-use nonce and demo availability |
| POST | /auth/google | Nonce-bound verified Google credential login |
| POST | /auth/demo | Explicit nonproduction fictional demo login |
| GET | /auth/me | Current identity and session CSRF token, or null |
| POST | /auth/logout | Authenticated CSRF-protected logout |
| GET | /tournaments | Public directory and progress counts |
| POST | /tournaments | Preassigned organizer creates tournament |
| GET | /tournaments/:id | Public overview, fixtures, accepted rosters, derived standings/scorers |
| PATCH | /tournaments/:id | Owner metadata update |
| GET | /tournaments/:id/applications | Owner sees all; captain sees only own private applications |
| POST | /tournaments/:id/applications | Authenticated captain submits registration roster |
| POST | /tournaments/:id/applications/:applicationId/review | Owner accepts/rejects pending application |
| POST | /tournaments/:id/fixtures/generate | Owner creates round robin once |
| PATCH | /tournaments/:id/fixtures/:fixtureId | Owner sets ISO timezone kickoff and venue |
| GET | /tournaments/:id/fixtures/:fixtureId/players | Public eligible names/numbers for fixture |
| GET | /tournaments/:id/fixtures/:fixtureId/goals | Public goal events |
| PUT | /tournaments/:id/fixtures/:fixtureId/result | Owner sets scores and reconciled goal events |
| POST | /tournaments/:id/roster-window | Owner opens/closes second window |
| GET | /tournaments/:id/roster-requests | Owner sees all; captain sees own private proposals |
| POST | /tournaments/:id/roster-requests | Captain proposes removals/replacements for own accepted team |
| POST | /tournaments/:id/roster-requests/:requestId/review | Owner accepts/rejects proposal |

Applications use teamName, captainName, captainContact and players: [{name,studentId,shirtNumber,position}]. Results use homeScore, awayScore and goals: [{playerId,ownGoal}]. Proposals use applicationId, removeIds and replacements with the same player fields. Review requests use status accepted/rejected. Window requests use open true/false.

Tournament creation/editing requires name and startDate (a real YYYY-MM-DD calendar day), with optional description and venue. Public responses expose start_date. Existing records without the newly introduced date show Date not set until the owner edits them.
