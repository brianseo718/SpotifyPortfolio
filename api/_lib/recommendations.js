import { spotifyFetch } from './spotify.js';

export async function resolveRecommendations(recommendations) {
  const resolved = [];
  for (const rec of recommendations) {
    let spotifyUri = null;
    let spotifyUrl = null;
    try {
      const query = encodeURIComponent(`track:${rec.track_name} artist:${rec.artist_name}`);
      const result = await spotifyFetch(`/search?q=${query}&type=track&limit=1`);
      const track = result.tracks?.items?.[0];
      if (track) {
        spotifyUri = track.uri;
        spotifyUrl = track.external_urls?.spotify ?? null;
      }
    } catch {
      // leave unresolved — UI shows plain text without a link
    }
    resolved.push({ ...rec, spotify_uri: spotifyUri, spotify_url: spotifyUrl });
  }
  return resolved;
}
