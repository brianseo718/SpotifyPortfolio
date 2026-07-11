import { getDb, ensureSchema } from '../_lib/db.js';
import { runMoodAnalysis } from '../journal/[date].js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function handler(req, res) {
  const { date } = req.query;
  if (!DATE_RE.test(date)) {
    res.status(400).json({ error: 'Invalid date, expected YYYY-MM-DD' });
    return;
  }

  await ensureSchema();
  const db = getDb();

  let result = await db.execute({ sql: 'SELECT * FROM mood_analyses WHERE date = ?', args: [date] });

  if (result.rows.length === 0) {
    const snapshotResult = await db.execute({
      sql: 'SELECT date FROM daily_listening_snapshots WHERE date = ?',
      args: [date],
    });
    const journalResult = await db.execute({
      sql: 'SELECT entry_text FROM journal_entries WHERE date = ?',
      args: [date],
    });
    if (snapshotResult.rows.length > 0 && journalResult.rows.length > 0) {
      try {
        await runMoodAnalysis(date, journalResult.rows[0].entry_text);
        result = await db.execute({ sql: 'SELECT * FROM mood_analyses WHERE date = ?', args: [date] });
      } catch (err) {
        res.status(500).json({ error: err.message });
        return;
      }
    }
  }

  if (result.rows.length === 0) {
    res.status(404).json({ error: 'No mood analysis available for this date yet' });
    return;
  }

  const row = result.rows[0];
  res.status(200).json({ ...row, tags: JSON.parse(row.tags_json || '[]') });
}
