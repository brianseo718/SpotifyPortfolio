import { GoogleGenAI } from '@google/genai';

let client;

function getClient() {
  if (!client) {
    client = new GoogleGenAI({}); // reads GEMINI_API_KEY from env
  }
  return client;
}

const MODEL_ID = 'gemini-3.5-flash';

const MOOD_AND_RECS_SCHEMA = {
  type: 'object',
  properties: {
    mood_label: { type: 'string' },
    mood_emoji: { type: 'string' },
    summary: { type: 'string' },
    confidence: { type: 'number' },
    tags: { type: 'array', items: { type: 'string' } },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          track_name: { type: 'string' },
          artist_name: { type: 'string' },
          reason: { type: 'string' },
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

  const interaction = await getClient().interactions.create({
    model: MODEL_ID,
    input: prompt,
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: MOOD_AND_RECS_SCHEMA,
    },
  });

  if (!interaction.output_text) {
    throw new Error('Gemini did not return a structured mood analysis');
  }
  return { result: JSON.parse(interaction.output_text), modelId: MODEL_ID };
}
