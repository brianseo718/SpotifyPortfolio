import React from 'react';
import { theme } from '../lib/theme';

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-8">
      <div className={`w-8 h-8 border-4 border-${theme.primaryAccent} border-t-transparent rounded-full animate-spin`}></div>
    </div>
  );
}
