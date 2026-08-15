'use client';

import { useContext } from 'react';
import { StreakContext, type StreakContextValue } from '@/app/contexts/StreakContext';

export const useStreak = (): StreakContextValue => {
  const context = useContext(StreakContext);
  if (context === null) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
};
