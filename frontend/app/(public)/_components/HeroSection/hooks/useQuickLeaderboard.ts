'use client';
import {useQuery} from '@tanstack/react-query';

import {getQuickChallengeLeaderboard} from '@/app/apis/userTestApi';
import type {QuickLeaderboardEntry} from '@/app/types/attempt';
import {EMPTY_LIST} from '@/app/utils/stableEmpty';

export const quickLeaderboardKeys = {
  list: (limit: number, examTypeId?: string) => ['full-mock-leaderboard', examTypeId ?? null, limit] as const,
};

export function useQuickLeaderboard(limit: number, examTypeId?: string) {
  const query = useQuery({
    queryKey: quickLeaderboardKeys.list(limit, examTypeId),
    queryFn: () => getQuickChallengeLeaderboard(limit, examTypeId),
    enabled: Boolean(examTypeId),
  });

  return {
    entries: (query.data?.entries ?? EMPTY_LIST) as QuickLeaderboardEntry[],
    totalParticipants: query.data?.totalParticipants ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
