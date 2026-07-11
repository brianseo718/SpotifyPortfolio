import { getDb, ensureSchema } from '../_lib/db.js';

const MONTH_RE = /^\d{4}-\d{2}$/;

export default async function handler(req, res) {
  const { month } = req.query;
  if (!MONTH_RE.test(month)) {
    res.status(400).json({ error: 'Invalid month, expected YYYY-MM' });
    return;
  }

  await ensureSchema();
  const db = getDb();
  const prefix = `${month}%`;

  const [snapshots, journals, moods] = await Promise.all([
    db.execute({ sql: 'SELECT date FROM daily_listening_snapshots WHERE date LIKE ?', args: [prefix] }),
    db.execute({ sql: 'SELECT date FROM journal_entries WHERE date LIKE ?', args: [prefix] }),
    db.execute({ sql: 'SELECT date, mood_emoji, mood_label FROM mood_analyses WHERE date LIKE ?', args: [prefix] }),
  ]);

  const snapshotDates = new Set(snapshots.rows.map((r) => r.date));
  const journalDates = new Set(journals.rows.map((r) => r.date));
  const moodByDate = new Map(moods.rows.map((r) => [r.date, r]));

  const allDates = new Set([...snapshotDates, ...journalDates, ...moodByDate.keys()]);

  const days = [...allDates].sort().map((date) => ({
    date,
    has_snapshot: snapshotDates.has(date),
    has_journal: journalDates.has(date),
    mood_emoji: moodByDate.get(date)?.mood_emoji ?? null,
    mood_label: moodByDate.get(date)?.mood_label ?? null,
  }));

  res.status(200).json({ month, days });
}
