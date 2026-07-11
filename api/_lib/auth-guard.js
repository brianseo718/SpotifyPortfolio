export function requireCronSecret(req) {
  const auth = req.headers.authorization || req.headers.Authorization;
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
}
