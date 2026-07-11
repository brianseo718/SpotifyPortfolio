import { getDb, ensureSchema } from '../_lib/db.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function handler(req, res) {
  const { date } = req.query;
  if (!DATE_RE.test(date)) {
    res.status(400).json({ error: 'Invalid date, expected YYYY-MM-DD' });
    return;
  }

  await ensureSchema();
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT date, track_count, unique_artist_count, top_genres_json, recently_played_json FROM daily_listening_snapshots WHERE date = ?',
    args: [date],
  });

  if (result.rows.length === 0) {
    res.status(404).json({ error: 'No listening data for this date yet' });
    return;
  }

  const row = result.rows[0];
  const tracks = JSON.parse(row.recently_played_json || '[]');
  const sampleTracks = tracks.slice(0, 10).map((item) => ({
    name: item.track?.name,
    artists: (item.track?.artists || []).map((a) => a.name).join(', '),
  }));

  res.status(200).json({
    date: row.date,
    track_count: row.track_count,
    unique_artist_count: row.unique_artist_count,
    top_genres: JSON.parse(row.top_genres_json || '[]'),
    sample_tracks: sampleTracks,
  });
}
