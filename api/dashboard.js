import { spotifyFetch, computeTopGenres } from './_lib/spotify.js';

export default async function handler(req, res) {
  const tab = req.query.tab || 'artists';
  const range = req.query.range || 'medium_term';

  try {
    const profile = await spotifyFetch('/me');

    let data;
    switch (tab) {
      case 'playlists': {
        const result = await spotifyFetch('/me/playlists?limit=20');
        data = result.items || [];
        break;
      }
      case 'tracks': {
        const result = await spotifyFetch(`/me/top/tracks?limit=20&time_range=${range}`);
        data = result.items || [];
        break;
      }
      case 'recentlyPlayed': {
        const result = await spotifyFetch('/me/player/recently-played?limit=20');
        data = result.items || [];
        break;
      }
      case 'genres': {
        const result = await spotifyFetch(`/me/top/artists?limit=20&time_range=${range}`);
        data = computeTopGenres(result.items || []);
        break;
      }
      case 'artists':
      default: {
        const result = await spotifyFetch(`/me/top/artists?limit=20&time_range=${range}`);
        data = result.items || [];
        break;
      }
    }

    res.status(200).json({ profile, data });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message });
  }
}
