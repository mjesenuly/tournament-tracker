# Testing guidelines

Run `npm ci`, `npm test`, then `npm run build` with Node.js 24+. GitHub Actions runs the same checks; successful local execution does not assert the remote CI already passed. Tests use isolated SQLite databases and temporary files. HTTP integration tests run Express on an ephemeral loopback port; test data is fictional.

Coverage includes persistence after reopen, transactional rollback, Google nonce/session/role/CSRF guards, public privacy projections, roster validation/approval conflicts, round robin odd/even pair coverage, standings ties and corrections, own goals, historical membership snapshots and midpoint replacements. React DOM tests use jsdom and Testing Library to execute directory navigation, roster input controls, organizer creation with CSRF and visible server errors. Mocked frontend tests validate interactions, not a real browser's visual appearance or real Google authentication.

Independent QA must separately review acceptance criteria, record actual commands and results, and return defects for correction. Only the orchestrator closes real GitHub issues after PASS. Live Google sign-in remains a manual integration prerequisite with configured credentials. Do not call demo authentication Google sign-in.
