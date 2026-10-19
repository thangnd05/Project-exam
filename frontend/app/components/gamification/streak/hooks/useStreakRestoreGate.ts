'use client';
import { useStreak } from '@/app/components/gamification/streak/hooks/useStreak';

export function useStreakRestoreGate() {
  const { promptRestore, dismissRestorePrompt, streakReady } = useStreak();

  return {
    blocked: promptRestore,
    allow: dismissRestorePrompt,
    streakReady,
  };
}
