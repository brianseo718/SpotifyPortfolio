import crypto from 'crypto';

const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SCOPES =
  'user-top-read user-read-private user-read-email playlist-read-private user-read-recently-played user-library-read';

export default function handler(req, res) {
  const state = crypto.randomBytes(16).toString('hex');

  res.setHeader(
    'Set-Cookie',
    `spotify_auth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
  );

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: SCOPES,
    state,
  });

  res.writeHead(302, { Location: `${AUTH_ENDPOINT}?${params.toString()}` });
  res.end();
}
