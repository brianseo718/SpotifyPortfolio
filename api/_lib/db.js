import { createClient } from '@libsql/client';

let client;

export function getDb() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) {
      throw new Error('TURSO_DATABASE_URL is not set');
    }
    client = createClient({ url, authToken });
  }
  return client;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS spotify_auth (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  scope TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_listening_snapshots (
  date TEXT PRIMARY KEY,
  pulled_at INTEGER NOT NULL,
  recently_played_json TEXT NOT NULL,
  top_artists_json TEXT,
  top_tracks_json TEXT,
  top_genres_json TEXT,
  track_count INTEGER NOT NULL DEFAULT 0,
  unique_artist_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS journal_entries (
  date TEXT PRIMARY KEY,
  entry_text TEXT NOT NULL,
  activities_json TEXT,
  self_mood_emoji TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS mood_analyses (
  date TEXT PRIMARY KEY,
  mood_label TEXT NOT NULL,
  mood_emoji TEXT,
  summary TEXT NOT NULL,
  confidence REAL,
  tags_json TEXT,
  model_id TEXT NOT NULL,
  generated_at INTEGER NOT NULL,
  FOREIGN KEY (date) REFERENCES daily_listening_snapshots(date)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  spotify_uri TEXT,
  spotify_url TEXT,
  image_url TEXT,
  reason TEXT,
  rank INTEGER NOT NULL DEFAULT 0,
  generated_at INTEGER NOT NULL,
  FOREIGN KEY (date) REFERENCES daily_listening_snapshots(date)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_date ON recommendations(date);
`;

// Columns added after the initial release — ALTER TABLE for databases created
// before these existed. Safe to re-run: duplicate-column errors are ignored.
const MIGRATIONS = [
  'ALTER TABLE journal_entries ADD COLUMN activities_json TEXT',
  'ALTER TABLE journal_entries ADD COLUMN self_mood_emoji TEXT',
  'ALTER TABLE recommendations ADD COLUMN image_url TEXT',
];

export async function ensureSchema() {
  const db = getDb();
  await db.executeMultiple(SCHEMA);
  for (const migration of MIGRATIONS) {
    try {
      await db.execute(migration);
    } catch (err) {
      if (!/duplicate column/i.test(err.message)) throw err;
    }
  }
}
