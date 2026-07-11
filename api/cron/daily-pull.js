import { spotifyFetch, computeTopGenres } from '../_lib/spotify.js';
import { getDb, ensureSchema } from '../_lib/db.js';
import { requireCronSecret } from '../_lib/auth-guard.js';

function todayDateString() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function mergeTracks(existingJson, freshItems) {
  const existing = existingJson ? JSON.parse(existingJson) : [];
  const seen = new Set(existing.map((item) => `${item.track?.id}-${item.played_at}`));
  const merged = [...existing];
  for (const item of freshItems) {
    const key = `${item.track?.id}-${item.played_at}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

export default async function handler(req, res) {
  try {
    requireCronSecret(req);
    await ensureSchema();

    const [recentlyPlayed, topArtists, topTracks] = await Promise.all([
      spotifyFetch('/me/player/recently-played?limit=50'),
      spotifyFetch('/me/top/artists?limit=20&time_range=short_term'),
      spotifyFetch('/me/top/tracks?limit=20&time_range=short_term'),
    ]);

    const topGenres = computeTopGenres(topArtists.items || []);
    const date = todayDateString();
    const db = getDb();

    const existing = await db.execute({
      sql: 'SELECT recently_played_json FROM daily_listening_snapshots WHERE date = ?',
      args: [date],
    });

    const mergedTracks = mergeTracks(existing.rows[0]?.recently_played_json, recentlyPlayed.items || []);
    const uniqueArtistIds = new Set(
      mergedTracks.flatMap((item) => (item.track?.artists || []).map((a) => a.id))
    );

    await db.execute({
      sql: `INSERT INTO daily_listening_snapshots
              (date, pulled_at, recently_played_json, top_artists_json, top_tracks_json, top_genres_json, track_count, unique_artist_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
              pulled_at = excluded.pulled_at,
              recently_played_json = excluded.recently_played_json,
              top_artists_json = excluded.top_artists_json,
              top_tracks_json = excluded.top_tracks_json,
              top_genres_json = excluded.top_genres_json,
              track_count = excluded.track_count,
              unique_artist_count = excluded.unique_artist_count`,
      args: [
        date,
        Date.now(),
        JSON.stringify(mergedTracks),
        JSON.stringify(topArtists.items || []),
        JSON.stringify(topTracks.items || []),
        JSON.stringify(topGenres),
        mergedTracks.length,
        uniqueArtistIds.size,
      ],
    });

    res.status(200).json({ date, track_count: mergedTracks.length, unique_artist_count: uniqueArtistIds.size });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message });
  }
}
