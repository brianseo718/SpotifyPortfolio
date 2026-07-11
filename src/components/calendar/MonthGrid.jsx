import React from 'react';
import { theme } from '../../lib/theme';
import DayCell from './DayCell';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function MonthGrid({ year, month, daysByDate }) {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingBlanks = firstOfMonth.getUTCDay();
  const todayIso = new Date().toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push(<div key={`blank-${i}`} />);
  }
  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
    const dateStr = `${year}-${pad(month)}-${pad(dayNumber)}`;
    cells.push(
      <DayCell
        key={dateStr}
        date={dateStr}
        dayNumber={dayNumber}
        day={daysByDate.get(dateStr)}
        isToday={dateStr === todayIso}
      />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className={`text-center text-xs font-semibold ${theme.lighterTextColor}`}>
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">{cells}</div>
    </div>
  );
}
