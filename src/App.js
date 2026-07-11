import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { theme } from './lib/theme';
import NavBar from './components/layout/NavBar';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import DayDetail from './pages/DayDetail';

function App() {
  return (
    <BrowserRouter>
      <div className={`min-h-screen bg-gradient-to-br ${theme.bg} ${theme.textColor} relative overflow-hidden`}>
        {/* Animated background elements for a modern touch */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-${theme.primaryAccent} rounded-full opacity-10 blur-3xl animate-blob-one`}></div>
          <div className={`absolute top-3/4 right-1/4 w-72 h-72 bg-${theme.secondaryAccent} rounded-full opacity-15 blur-3xl animate-blob-two`}></div>
          <div className={`absolute bottom-1/4 left-1/3 w-64 h-64 bg-${theme.tertiaryAccent} rounded-full opacity-12 blur-3xl animate-blob-three`}></div>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-${theme.primaryAccent} rounded-full opacity-5 animate-pulse-slow`}></div>
          <div className={`absolute top-1/3 right-1/4 w-32 h-32 bg-${theme.secondaryAccent} rounded-full opacity-7 animate-pulse-fast`}></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          <NavBar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/calendar/:date" element={<DayDetail />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
