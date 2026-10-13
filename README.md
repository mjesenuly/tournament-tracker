# Tournament Tracker

University football tournament management (6v6). This repository follows the PM → engineer → independent QA workflow in `_docs/process.md`; requirements and genuine discovery are in `_docs/plan.md` and `chat-brainstorm.md`.

## Current implementation

TT-01 foundation: React/TypeScript/Vite frontend, Express health endpoint and durable SQLite schema. Authentication and tournament workflows are upcoming tasks. The foundation screen is intentionally not a claim of completed tournament functionality.

## Run locally

Requires Node.js 24 or newer and npm. Run `npm ci`. Optionally copy `.env.example` to `.env` and configure values. Start `npm run dev:server` in one terminal and `npm run dev` in another. Open the Vite URL (normally http://localhost:5173). API health: http://localhost:3001/api/health. Run `npm test` and `npm run build` for verification. `npm start` starts the API without watch mode; hosting the built frontend is not yet included.

SQLite defaults to `data/tournament-tracker.sqlite`, outside source control. It persists across restarts; deleting this file deletes local data. Set `DATABASE_PATH` to an absolute durable path in hosted environments. No cloud deployment is configured.

## Architecture

See `_docs/architecture.md`. Secrets and actual student records must never be committed. Google OAuth fields in the environment example are placeholders, not working authentication. Setup and integration are planned under TT-02.
