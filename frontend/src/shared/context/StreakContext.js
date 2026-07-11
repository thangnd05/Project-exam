import { createContext, useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '~/shared/config/queryClient';
import { getMyStreak, restoreStreak as restoreStreakApi } from '~/shared/api/streakApi';
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

  // Manual refresh (after finishing a test / practice). Celebrates only when the
  // streak actually grew compared to the value we knew before refetching.
  const refreshStreak = useCallback(async () => {
    if (!isAuthenticated) return;
    const before = queryClient.getQueryData(STREAK_QUERY_KEY)?.currentStreak ?? 0;
    await queryClient.refetchQueries({ queryKey: STREAK_QUERY_KEY });
    const after = queryClient.getQueryData(STREAK_QUERY_KEY)?.currentStreak ?? 0;
    if (after > before) setJustIncreased(true);
  }, [isAuthenticated]);

  // Write. Kept as a plain async action for this pass; after a successful
  // restore we push the fresh data into the cache and invalidate so every
  // streak consumer updates.
  const restoreStreak = useCallback(async () => {
    const result = await restoreStreakApi();
    queryClient.setQueryData(STREAK_QUERY_KEY, result);
    queryClient.invalidateQueries({ queryKey: STREAK_QUERY_KEY });
    return result;
  }, []);

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
      restoreStreak,
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
      restoreStreak,
      clearJustIncreased,
    ]
  );

  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
};
