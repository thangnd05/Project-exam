'use client';

import { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/app/configs/queryClient';
import { getMyStreak } from '@/app/apis/streakApi';
import { useAuth } from '@/app/hooks/useAuth';
import type { StreakResponse } from '@/app/types';

export type StreakContextValue = {
  currentStreak: number;
  longestStreak: number;
  lostStreak: number;
  canRecover: boolean;
  recoverCost: number;
  justIncreased: boolean;
  streakReady: boolean;
  promptRestore: boolean;
  dismissRestorePrompt: () => void;
  refreshStreak: () => Promise<void>;
  clearJustIncreased: () => void;
};

export const StreakContext = createContext<StreakContextValue | null>(null);

export const STREAK_QUERY_KEY = ['myStreak'];

const RESTORE_PROMPT_DISMISS_KEY = 'streak-restore-prompt-dismissed';

export const StreakProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [justIncreased, setJustIncreased] = useState(false);

  const { data, isFetched } = useQuery({
    queryKey: STREAK_QUERY_KEY,
    queryFn: getMyStreak,
    enabled: isAuthenticated,
  });
  const [dismissed, setDismissed] = useState(false);
  const [dismissReady, setDismissReady] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(RESTORE_PROMPT_DISMISS_KEY) === '1');
    setDismissReady(true);
  }, []);

  useEffect(() => {
    if (!dismissReady || !isAuthenticated || !isFetched) return;
    const recoverable = Boolean(data?.canRecover) && (data?.lostStreak ?? 0) > 0;
    if (!recoverable) {
      sessionStorage.removeItem(RESTORE_PROMPT_DISMISS_KEY);
      setDismissed(false);
    }
  }, [dismissReady, isAuthenticated, isFetched, data]);

  const streak: StreakResponse | null = isAuthenticated ? data ?? null : null;
  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;
  const lostStreak = streak?.lostStreak ?? 0;
  const canRecover = Boolean(streak?.canRecover);
  const recoverCost = streak?.recoverCost ?? 0;
  const streakReady = !isAuthenticated || (dismissReady && isFetched);
  const promptRestore =
    streakReady && isAuthenticated && canRecover && lostStreak > 0 && !dismissed;

  const dismissRestorePrompt = useCallback(() => {
    sessionStorage.setItem(RESTORE_PROMPT_DISMISS_KEY, '1');
    setDismissed(true);
  }, []);

  const refreshStreak = useCallback(async () => {
    if (!isAuthenticated) return;
    const before = queryClient.getQueryData<StreakResponse>(STREAK_QUERY_KEY)?.currentStreak ?? 0;
    await queryClient.refetchQueries({ queryKey: STREAK_QUERY_KEY });
    const after = queryClient.getQueryData<StreakResponse>(STREAK_QUERY_KEY)?.currentStreak ?? 0;
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
      streakReady,
      promptRestore,
      dismissRestorePrompt,
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
      streakReady,
      promptRestore,
      dismissRestorePrompt,
      refreshStreak,
      clearJustIncreased,
    ]
  );

  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
};
