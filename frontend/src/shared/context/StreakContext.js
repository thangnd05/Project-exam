import { createContext, useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '~/shared/config/queryClient';
import { getMyStreak } from '~/shared/api/streakApi';
import { useAuth } from '~/shared/hooks/useAuth';

export const StreakContext = createContext(null);

export const STREAK_QUERY_KEY = ['myStreak'];

export const StreakProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [justIncreased, setJustIncreased] = useState(false);

  const { data } = useQuery({
    queryKey: STREAK_QUERY_KEY,
    queryFn: getMyStreak,
    enabled: isAuthenticated,
  });

  const streak = isAuthenticated ? data : null;
  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;
  const lostStreak = streak?.lostStreak ?? 0;
  const canRecover = Boolean(streak?.canRecover);
  const recoverCost = streak?.recoverCost ?? 0;

  const refreshStreak = useCallback(async () => {
    if (!isAuthenticated) return;
    const before = queryClient.getQueryData(STREAK_QUERY_KEY)?.currentStreak ?? 0;
    await queryClient.refetchQueries({ queryKey: STREAK_QUERY_KEY });
    const after = queryClient.getQueryData(STREAK_QUERY_KEY)?.currentStreak ?? 0;
    if (after > before) setJustIncreased(true);
  }, [isAuthenticated]);

  const clearJustIncreased = useCallback(() => setJustIncreased(false), []);

  const value = useMemo(
    () => ({
      currentStreak,
      longestStreak,
      lostStreak,
      canRecover,
      recoverCost,
      justIncreased: isAuthenticated && justIncreased,
      refreshStreak,
      clearJustIncreased,
    }),
    [
      currentStreak,
      longestStreak,
      lostStreak,
      canRecover,
      recoverCost,
      isAuthenticated,
      justIncreased,
      refreshStreak,
      clearJustIncreased,
    ]
  );

  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
};
