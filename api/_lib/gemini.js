const MODEL_ID = 'gemini-3.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const MOOD_AND_RECS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    mood_label: { type: 'STRING' },
    mood_emoji: { type: 'STRING' },
    summary: { type: 'STRING' },
    confidence: { type: 'NUMBER' },
    tags: { type: 'ARRAY', items: { type: 'STRING' } },
    recommendations: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          track_name: { type: 'STRING' },
          artist_name: { type: 'STRING' },
          reason: { type: 'STRING' },
        },
        required: ['track_name', 'artist_name', 'reason'],
      },
    },
  },
  required: ['mood_label', 'mood_emoji', 'summary', 'confidence', 'tags', 'recommendations'],
};

function summarizeTracksForPrompt(snapshot) {
  const tracks = JSON.parse(snapshot.recently_played_json || '[]');
  return tracks
    .slice(0, 30)
    .map((item) => `- ${item.track?.name} by ${(item.track?.artists || []).map((a) => a.name).join(', ')}`)
    .join('\n');
}

export async function analyzeDay({ date, snapshot, journalText }) {
  const prompt = `You are a thoughtful music-and-mood analyst. Given a day's Spotify listening activity and the user's own journal entry, identify the mood/emotional tone of the day and recommend music. Respond only with JSON matching the provided schema.

Date: ${date}

Journal entry: "${journalText}"

Tracks played today (${snapshot.track_count} plays, ${snapshot.unique_artist_count} unique artists):
${summarizeTracksForPrompt(snapshot)}

Top genres today: ${snapshot.top_genres_json || '[]'}

Based on the journal entry and the actual tracks/genres listened to today, identify the mood/emotional tone of the day, and suggest 3-5 songs that fit or complement that mood -- reasoned specifically against today's listening, not generic "similar artist" picks.`;

  const apiKey = process.env.GEMINI_API_KEY;
  const resp = await fetch(`${API_BASE}/${MODEL_ID}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: MOOD_AND_RECS_SCHEMA,
      },
    }),
  });

  if (!resp.ok) {
    throw new Error(`Gemini API error ${resp.status}: ${await resp.text()}`);
  }

  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini did not return a structured mood analysis');
  }
  return { result: JSON.parse(text), modelId: MODEL_ID };
}
