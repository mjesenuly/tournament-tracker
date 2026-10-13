import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export function openDatabase(path = process.env.DATABASE_PATH || './data/tournament-tracker.sqlite') {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, google_sub TEXT UNIQUE, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'captain' CHECK(role IN ('captain','organizer')));
    CREATE TABLE IF NOT EXISTS tournaments (id TEXT PRIMARY KEY, organizer_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'registration' CHECK(status IN ('registration','ongoing','completed')), window_state TEXT NOT NULL DEFAULT 'not_opened' CHECK(window_state IN ('not_opened','open','closed')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, tournament_id TEXT NOT NULL REFERENCES tournaments(id), captain_id TEXT NOT NULL REFERENCES users(id), team_name TEXT NOT NULL, captain_name TEXT NOT NULL, captain_contact TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')), UNIQUE(tournament_id,team_name));
    CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, tournament_id TEXT NOT NULL REFERENCES tournaments(id), application_id TEXT NOT NULL REFERENCES applications(id), name TEXT NOT NULL, student_id TEXT NOT NULL, shirt_number INTEGER NOT NULL CHECK(shirt_number BETWEEN 1 AND 99), position TEXT NOT NULL, UNIQUE(application_id,student_id));
    CREATE TABLE IF NOT EXISTS eligibility (tournament_id TEXT NOT NULL REFERENCES tournaments(id), student_id TEXT NOT NULL, application_id TEXT NOT NULL REFERENCES applications(id), PRIMARY KEY(tournament_id,student_id));
    CREATE TABLE IF NOT EXISTS memberships (id INTEGER PRIMARY KEY, player_id TEXT NOT NULL REFERENCES players(id), application_id TEXT NOT NULL REFERENCES applications(id), joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, removed_at TEXT);
    CREATE TABLE IF NOT EXISTS fixtures (id TEXT PRIMARY KEY, tournament_id TEXT NOT NULL REFERENCES tournaments(id), home_id TEXT NOT NULL REFERENCES applications(id), away_id TEXT NOT NULL REFERENCES applications(id), round INTEGER NOT NULL CHECK(round>0), scheduled_at TEXT, venue TEXT, status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','finished')), home_score INTEGER CHECK(home_score>=0), away_score INTEGER CHECK(away_score>=0), CHECK(home_id<>away_id), UNIQUE(tournament_id,home_id,away_id));
    CREATE TABLE IF NOT EXISTS goals (id INTEGER PRIMARY KEY, fixture_id TEXT NOT NULL REFERENCES fixtures(id), player_id TEXT NOT NULL REFERENCES players(id), own_goal INTEGER NOT NULL DEFAULT 0 CHECK(own_goal IN (0,1)));
    CREATE TABLE IF NOT EXISTS roster_requests (id TEXT PRIMARY KEY, application_id TEXT NOT NULL REFERENCES applications(id), captain_id TEXT NOT NULL REFERENCES users(id), changes_json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  `);
  return db;
}
export function transaction<T>(db: DatabaseSync, action: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try { const result = action(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}
