import { getDb, ensureSchema } from '../_lib/db.js';
import { analyzeDay } from '../_lib/gemini.js';
import { resolveRecommendations } from '../_lib/recommendations.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function handler(req, res) {
  const { date } = req.query;
  if (!DATE_RE.test(date)) {
    res.status(400).json({ error: 'Invalid date, expected YYYY-MM-DD' });
    return;
  }

  await ensureSchema();
  const db = getDb();

  if (req.method === 'GET') {
    const result = await db.execute({
      sql: 'SELECT * FROM journal_entries WHERE date = ?',
      args: [date],
    });
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No journal entry for this date' });
      return;
    }
    const row = result.rows[0];
    res.status(200).json({
      ...row,
      activities: JSON.parse(row.activities_json || '[]'),
    });
    return;
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const entryText = (body.entry_text || '').trim();
    if (!entryText) {
      res.status(400).json({ error: 'entry_text is required' });
      return;
    }
    if (entryText.length > 5000) {
      res.status(400).json({ error: 'entry_text must be 5000 characters or fewer' });
      return;
    }
    const activities = Array.isArray(body.activities) ? body.activities.filter((a) => typeof a === 'string') : [];
    const selfMoodEmoji = typeof body.self_mood_emoji === 'string' ? body.self_mood_emoji : null;

    const now = Date.now();
    await db.execute({
      sql: `INSERT INTO journal_entries (date, entry_text, activities_json, self_mood_emoji, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
              entry_text = excluded.entry_text,
              activities_json = excluded.activities_json,
              self_mood_emoji = excluded.self_mood_emoji,
              updated_at = excluded.updated_at`,
      args: [date, entryText, JSON.stringify(activities), selfMoodEmoji, now, now],
    });

    let moodError = null;
    try {
      await runMoodAnalysis(date, entryText);
    } catch (err) {
      moodError = err.message;
    }

    res.status(200).json({ date, entry_text: entryText, activities, self_mood_emoji: selfMoodEmoji, mood_error: moodError });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

export async function runMoodAnalysis(date, journalText) {
  const db = getDb();
  const snapshotResult = await db.execute({
    sql: 'SELECT * FROM daily_listening_snapshots WHERE date = ?',
    args: [date],
  });
  const snapshot = snapshotResult.rows[0];
  if (!snapshot) {
    throw new Error('No listening snapshot exists for this date yet');
  }

  const { result, modelId } = await analyzeDay({ date, snapshot, journalText });

  const generatedAt = Date.now();
  await db.execute({
    sql: `INSERT INTO mood_analyses (date, mood_label, mood_emoji, summary, confidence, tags_json, model_id, generated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(date) DO UPDATE SET
            mood_label = excluded.mood_label,
            mood_emoji = excluded.mood_emoji,
            summary = excluded.summary,
            confidence = excluded.confidence,
            tags_json = excluded.tags_json,
            model_id = excluded.model_id,
            generated_at = excluded.generated_at`,
    args: [
      date,
      result.mood_label,
      result.mood_emoji,
      result.summary,
      result.confidence,
      JSON.stringify(result.tags || []),
      modelId,
      generatedAt,
    ],
  });

  await db.execute({ sql: 'DELETE FROM recommendations WHERE date = ?', args: [date] });
  const resolved = await resolveRecommendations(result.recommendations || []);
  for (let i = 0; i < resolved.length; i++) {
    const rec = resolved[i];
    await db.execute({
      sql: `INSERT INTO recommendations (date, track_name, artist_name, spotify_uri, spotify_url, image_url, reason, rank, generated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [date, rec.track_name, rec.artist_name, rec.spotify_uri, rec.spotify_url, rec.image_url, rec.reason, i, generatedAt],
    });
  }
}
