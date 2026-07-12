import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Music2, Sparkles, ListMusic, Music } from 'lucide-react';
import { theme } from '../lib/theme';
import LoadingSpinner from '../components/LoadingSpinner';
import MoodBadge from '../components/calendar/MoodBadge';
import { ACTIVITY_OPTIONS, MOOD_OPTIONS } from '../lib/journalOptions';

async function fetchJson(url) {
  const response = await fetch(url);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, i) => val === sortedB[i]);
}

function DayDetail() {
  const { date } = useParams();
  const [snapshot, setSnapshot] = useState(null);
  const [journalText, setJournalText] = useState('');
  const [activities, setActivities] = useState([]);
  const [selfMoodEmoji, setSelfMoodEmoji] = useState(null);
  const [saved, setSaved] = useState({ entry_text: '', activities: [], self_mood_emoji: null });
  const [mood, setMood] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [snapshotData, journalData, moodData, recsData] = await Promise.all([
        fetchJson(`/api/snapshot/${date}`),
        fetchJson(`/api/journal/${date}`),
        fetchJson(`/api/mood/${date}`),
        fetchJson(`/api/recommendations/${date}`),
      ]);
      setSnapshot(snapshotData);
      setJournalText(journalData?.entry_text || '');
      setActivities(journalData?.activities || []);
      setSelfMoodEmoji(journalData?.self_mood_emoji || null);
      setSaved({
        entry_text: journalData?.entry_text || '',
        activities: journalData?.activities || [],
        self_mood_emoji: journalData?.self_mood_emoji || null,
      });
      setMood(moodData);
      setRecommendations(recsData || []);
    } catch (error) {
      console.error('Error loading day detail:', error);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const toggleActivity = (key) => {
    setActivities((prev) => (prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]));
  };

  const hasChanges =
    journalText !== saved.entry_text ||
    !arraysEqual(activities, saved.activities) ||
    selfMoodEmoji !== saved.self_mood_emoji;

  const handleSaveJournal = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/journal/${date}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_text: journalText, activities, self_mood_emoji: selfMoodEmoji }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setSaved({ entry_text: journalText, activities, self_mood_emoji: selfMoodEmoji });
      if (result.mood_error) {
        setSaveError(`Entry saved, but mood analysis failed: ${result.mood_error}`);
      }
      await loadAll();
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      <Link
        to="/calendar"
        className={`inline-flex items-center gap-2 ${theme.lightTextColor} hover:text-${theme.primaryAccent} transition-colors duration-200`}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to calendar
      </Link>

      <div className={`bg-${theme.cardBg} backdrop-blur-lg border ${theme.cardBorder} rounded-3xl p-8 shadow-2xl`}>
        <div className="flex items-center gap-3 mb-6">
          {mood?.mood_emoji && <MoodBadge emoji={mood.mood_emoji} label={mood.mood_label} />}
          <h2 className="text-2xl md:text-3xl font-bold">{date}</h2>
        </div>

        <div className="mb-8">
          <label className={`block text-sm font-semibold mb-2 ${theme.lightTextColor}`}>
            How did today go?
          </label>
          <textarea
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            rows={4}
            maxLength={5000}
            placeholder="Write a few sentences about your day..."
            className={`w-full ${theme.buttonBg} ${theme.textColor} rounded-xl p-4 border ${theme.cardBorder} focus:outline-none focus:ring-2 focus:ring-${theme.primaryAccent}`}
          />
        </div>

        <div className="mb-8">
          <label className={`block text-sm font-semibold mb-3 ${theme.lightTextColor}`}>
            What did you do today?
          </label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_OPTIONS.map((activity) => {
              const isSelected = activities.includes(activity.key);
              return (
                <button
                  key={activity.key}
                  type="button"
                  onClick={() => toggleActivity(activity.key)}
                  aria-pressed={isSelected}
                  className={`flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? `bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white shadow-lg`
                      : `${theme.buttonBg} ${theme.buttonText}`
                  }`}
                >
                  <span>{activity.emoji}</span>
                  {activity.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-8">
          <label className={`block text-sm font-semibold mb-3 ${theme.lightTextColor}`}>
            How would you rate today?
          </label>
          <div className="flex gap-3">
            {MOOD_OPTIONS.map((option) => {
              const isSelected = selfMoodEmoji === option.emoji;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelfMoodEmoji(isSelected ? null : option.emoji)}
                  aria-pressed={isSelected}
                  title={option.label}
                  className={`flex flex-col items-center gap-1 py-3 px-4 rounded-xl transition-all duration-200 ${
                    isSelected
                      ? `bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} shadow-lg scale-110`
                      : `${theme.buttonBg} hover:-translate-y-0.5`
                  }`}
                >
                  <span className="text-2xl leading-none">{option.emoji}</span>
                  <span className={`text-xs ${isSelected ? 'text-white' : theme.lighterTextColor}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleSaveJournal}
            disabled={isSaving || !journalText.trim() || (!hasChanges && !saveError)}
            className={`bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white font-semibold py-2 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300`}
          >
            {isSaving ? 'Saving...' : saveError ? 'Retry' : 'Save entry'}
          </button>
          {saveError && <span className="text-red-400 text-sm">{saveError}</span>}
        </div>

        {mood && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className={`w-5 h-5 text-${theme.primaryAccent}`} />
              <h3 className="text-lg font-semibold">{mood.mood_label}</h3>
            </div>
            <p className={`${theme.lightTextColor} leading-relaxed mb-3`}>{mood.summary}</p>
            {mood.tags && mood.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {mood.tags.map((tag, i) => (
                  <span
                    key={i}
                    className={`text-xs ${theme.buttonBg} ${theme.buttonText} px-3 py-1 rounded-full`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {!mood && saved.entry_text && (
          <p className={`${theme.lighterTextColor} text-sm mb-8`}>
            Mood analysis will appear here shortly after saving your journal entry.
          </p>
        )}

        {snapshot && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Music2 className={`w-5 h-5 text-${theme.primaryAccent}`} />
              <h3 className="text-lg font-semibold">Listening Summary</h3>
            </div>
            <p className={`${theme.lightTextColor} mb-3`}>
              {snapshot.track_count} plays across {snapshot.unique_artist_count} unique artists
            </p>
            {snapshot.top_genres && snapshot.top_genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {snapshot.top_genres.slice(0, 8).map((genre, i) => (
                  <span
                    key={i}
                    className={`text-xs ${theme.buttonBg} ${theme.buttonText} px-3 py-1 rounded-full`}
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        {!snapshot && (
          <p className={`${theme.lighterTextColor} text-sm mb-8`}>
            No Spotify listening data was captured for this date.
          </p>
        )}

        {recommendations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ListMusic className={`w-5 h-5 text-${theme.primaryAccent}`} />
              <h3 className="text-lg font-semibold">Recommended For This Day</h3>
            </div>
            <ul className="space-y-2">
              {recommendations.map((rec) => (
                <li
                  key={rec.id}
                  className={`${theme.buttonBg} rounded-xl p-4 flex items-center gap-4`}
                >
                  {rec.image_url ? (
                    <img
                      src={rec.image_url}
                      alt={`${rec.track_name} album art`}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Music className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 min-w-0">
                    {rec.spotify_url ? (
                      <a
                        href={rec.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-semibold hover:text-${theme.primaryAccent} transition-colors duration-200 truncate`}
                      >
                        {rec.track_name} — {rec.artist_name}
                      </a>
                    ) : (
                      <span className="font-semibold truncate">{rec.track_name} — {rec.artist_name}</span>
                    )}
                    {rec.reason && <span className={`text-sm ${theme.lightTextColor}`}>{rec.reason}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default DayDetail;
