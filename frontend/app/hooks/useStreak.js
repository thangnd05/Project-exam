'use client';

import { useContext } from 'react';
import { StreakContext } from '@/app/contexts/StreakContext';

export const useStreak = () => {
  const context = useContext(StreakContext);
  if (context === null) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
};
