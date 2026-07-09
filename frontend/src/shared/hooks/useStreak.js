import { useContext } from 'react';
import { StreakContext } from '~/shared/context/StreakContext';

export const useStreak = () => {
  const context = useContext(StreakContext);
  if (context === null) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
};
