import React from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../../lib/theme';
import MoodBadge from './MoodBadge';

export default function DayCell({ date, dayNumber, day, isToday }) {
  const navigate = useNavigate();
  const hasData = day && (day.has_snapshot || day.has_journal);

  return (
    <button
      onClick={() => navigate(`/calendar/${date}`)}
      className={`aspect-square rounded-xl border ${theme.cardBorder} ${
        hasData ? `bg-${theme.cardBg}` : 'bg-gray-900/20'
      } ${isToday ? `ring-2 ring-${theme.primaryAccent}` : ''} flex flex-col items-center justify-center gap-1 p-2 hover:-translate-y-1 transition-transform duration-200`}
    >
      <span className={`text-sm ${theme.lightTextColor}`}>{dayNumber}</span>
      {day?.mood_emoji ? (
        <MoodBadge emoji={day.mood_emoji} label={day.mood_label} />
      ) : (
        <span className={`text-xs ${theme.lighterTextColor}`}>{hasData ? '·' : ''}</span>
      )}
    </button>
  );
}
