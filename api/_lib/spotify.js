import { getDb } from './db.js';

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

function basicAuthHeader() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

export async function exchangeCodeForTokens(code, redirectUri) {
  const resp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!resp.ok) {
    throw new Error(`Spotify token exchange failed: ${resp.status} ${await resp.text()}`);
  }
  return resp.json();
}

export async function saveInitialTokens({ access_token, refresh_token, expires_in, scope }) {
  const db = getDb();
  const now = Date.now();
  await db.execute({
    sql: `INSERT INTO spotify_auth (id, access_token, refresh_token, expires_at, scope, updated_at)
          VALUES (1, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            access_token = excluded.access_token,
            refresh_token = excluded.refresh_token,
            expires_at = excluded.expires_at,
            scope = excluded.scope,
            updated_at = excluded.updated_at`,
    args: [access_token, refresh_token, now + expires_in * 1000, scope ?? null, now],
  });
}

async function refreshAccessToken(refreshToken) {
  const resp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!resp.ok) {
    throw new Error(`Spotify token refresh failed: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json();
  const db = getDb();
  const now = Date.now();
  await db.execute({
    sql: `UPDATE spotify_auth SET access_token = ?, refresh_token = ?, expires_at = ?, scope = ?, updated_at = ? WHERE id = 1`,
    args: [
      data.access_token,
      data.refresh_token ?? refreshToken,
      now + data.expires_in * 1000,
      data.scope ?? null,
      now,
    ],
  });
  return data.access_token;
}

export async function getValidAccessToken() {
  const db = getDb();
  const result = await db.execute('SELECT * FROM spotify_auth WHERE id = 1');
  const row = result.rows[0];
  if (!row) {
    const err = new Error('Not authenticated with Spotify. Visit /api/auth/login first.');
    err.statusCode = 401;
    throw err;
  }
  const bufferMs = 60_000;
  if (Date.now() < row.expires_at - bufferMs) {
    return row.access_token;
  }
  return refreshAccessToken(row.refresh_token);
}

export async function spotifyFetch(path, { token, method = 'GET' } = {}) {
  const accessToken = token ?? (await getValidAccessToken());
  const resp = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    throw new Error(`Spotify API error ${resp.status} on ${path}: ${await resp.text()}`);
  }
  return resp.json();
}

export function computeTopGenres(artists) {
  const counts = {};
  for (const artist of artists) {
    for (const genre of artist.genres || []) {
      const normalized = genre.toLowerCase().replace(/\s+/g, ' ').trim();
      counts[normalized] = (counts[normalized] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));
}
