import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, CalendarDays, NotebookPen } from 'lucide-react';
import { theme } from '../../lib/theme';

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export default function NavBar() {
  const linkClass = ({ isActive }) =>
    `font-semibold py-2 px-5 rounded-xl transition-all duration-300 flex items-center gap-2 ${
      isActive
        ? `bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white shadow-lg`
        : `${theme.buttonBg} ${theme.buttonText}`
    }`;

  return (
    <div className="flex flex-wrap justify-center gap-3 mb-8">
      <NavLink to="/" end className={linkClass}>
        <BarChart3 className="w-5 h-5" />
        Dashboard
      </NavLink>
      <NavLink to="/calendar" className={linkClass}>
        <CalendarDays className="w-5 h-5" />
        Mood Calendar
      </NavLink>
      <NavLink to={`/calendar/${todayDateString()}`} className={linkClass}>
        <NotebookPen className="w-5 h-5" />
        Journal Today
      </NavLink>
    </div>
  );
}
