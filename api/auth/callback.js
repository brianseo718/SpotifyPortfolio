import { exchangeCodeForTokens, saveInitialTokens } from '../_lib/spotify.js';
import { ensureSchema } from '../_lib/db.js';

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    cookies[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return cookies;
}

export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    res.status(400).send(`Spotify authorization failed: ${error}`);
    return;
  }

  const cookies = parseCookies(req.headers.cookie);
  if (!state || state !== cookies.spotify_auth_state) {
    res.status(400).send('State mismatch — possible CSRF attempt.');
    return;
  }

  res.setHeader('Set-Cookie', 'spotify_auth_state=; Path=/; HttpOnly; Max-Age=0');

  try {
    await ensureSchema();
    const tokens = await exchangeCodeForTokens(code, process.env.SPOTIFY_REDIRECT_URI);
    await saveInitialTokens(tokens);
    res.writeHead(302, { Location: '/' });
    res.end();
  } catch (err) {
    res.status(500).send(`Spotify auth failed: ${err.message}`);
  }
}
