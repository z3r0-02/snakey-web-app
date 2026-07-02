import { createClient } from "@libsql/client";

// Use Turso in production, local SQLite file for development
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:data/local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize tables on first import
let initialized = false;

export async function initDb() {
  if (initialized) return client;

  await client.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name  TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      username   TEXT UNIQUE,
      password   TEXT NOT NULL,
      gender     TEXT,
      dob        TEXT,
      country    TEXT,
      avatar     TEXT,
      active_title TEXT,
      active_snake_color TEXT,
      self_crashes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS scores (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      username   TEXT NOT NULL,
      avatar     TEXT,
      score      INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS attempts (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date    TEXT NOT NULL,
      used    INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, date),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      token      TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS user_achievements (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id        INTEGER NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at    TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, achievement_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`
  ]);

  // Migrations for existing databases
  try {
    await client.execute(`ALTER TABLE users ADD COLUMN active_title TEXT`);
  } catch (e) {
    // Column already exists
  }
  try {
    await client.execute(`ALTER TABLE users ADD COLUMN active_snake_color TEXT`);
  } catch (e) {
    // Column already exists
  }

  initialized = true;

  try {
    await client.execute("ALTER TABLE users ADD COLUMN self_crashes INTEGER DEFAULT 0");
  } catch (e) {
    // Column might already exist
  }

  return client;
}

export default client;
