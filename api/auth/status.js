import { getDb } from '../_lib/db.js';

export default async function handler(req, res) {
  try {
    const db = getDb();
    const result = await db.execute('SELECT id FROM spotify_auth WHERE id = 1');
    res.status(200).json({ connected: result.rows.length > 0 });
  } catch (err) {
    res.status(200).json({ connected: false });
  }
}
