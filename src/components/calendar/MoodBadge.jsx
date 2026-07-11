import React from 'react';

export default function MoodBadge({ emoji, label }) {
  if (!emoji) return null;
  return (
    <span
      className="text-2xl leading-none"
      role="img"
      aria-label={label || 'mood'}
      title={label || undefined}
    >
      {emoji}
    </span>
  );
}
