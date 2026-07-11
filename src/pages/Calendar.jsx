import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { theme } from '../lib/theme';
import LoadingSpinner from '../components/LoadingSpinner';
import MonthGrid from '../components/calendar/MonthGrid';

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(n) {
  return String(n).padStart(2, '0');
}

function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1); // 1-indexed
  const [daysByDate, setDaysByDate] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const monthKey = `${year}-${pad(month)}`;

  const loadMonth = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/calendar/${monthKey}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { days } = await response.json();
      setDaysByDate(new Map(days.map((d) => [d.date, d])));
    } catch (error) {
      console.error('Error loading calendar month:', error);
      setDaysByDate(new Map());
    } finally {
      setIsLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const goToPrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div className={`bg-${theme.cardBg} backdrop-blur-lg border ${theme.cardBorder} rounded-3xl p-8 shadow-2xl`}>
      <div className="flex items-center justify-center gap-4 mb-8">
        <CalendarDays className={`w-8 h-8 text-${theme.primaryAccent}`} />
        <h2 className={`text-2xl md:text-4xl font-bold bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} bg-clip-text text-transparent`}>
          Mood Calendar
        </h2>
      </div>

      <div className="flex items-center justify-center gap-6 mb-8">
        <button
          onClick={goToPrevMonth}
          className={`${theme.buttonBg} ${theme.buttonText} p-2 rounded-lg hover:-translate-y-0.5 transition-transform duration-200`}
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-semibold">{MONTH_LABELS[month - 1]} {year}</span>
        <button
          onClick={goToNextMonth}
          className={`${theme.buttonBg} ${theme.buttonText} p-2 rounded-lg hover:-translate-y-0.5 transition-transform duration-200`}
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <MonthGrid year={year} month={month} daysByDate={daysByDate} />
      )}
    </div>
  );
}

export default Calendar;
