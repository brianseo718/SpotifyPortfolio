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
    sql: 'SELECT * FROM recommendations WHERE date = ? ORDER BY rank ASC',
    args: [date],
  });

  res.status(200).json(result.rows);
}
