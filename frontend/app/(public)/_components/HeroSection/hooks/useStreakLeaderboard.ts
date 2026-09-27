'use client';
import {useQuery} from '@tanstack/react-query';

import {getStreakLeaderboard} from '@/app/apis/streakApi';
import {keepPreviousData} from '@/app/configs/queryClient';
import type {StreakLeaderboardEntry} from '@/app/types/gamification';
import {EMPTY_LIST} from '@/app/utils/stableEmpty';

export const streakLeaderboardKeys = {
  list: (limit: number) => ['streak-leaderboard', limit] as const,
};

export function useStreakLeaderboard(limit: number, enabled = true) {
  const query = useQuery({
    queryKey: streakLeaderboardKeys.list(limit),
    queryFn: () => getStreakLeaderboard(limit),
    enabled,
    placeholderData: keepPreviousData,
  });

  return {
    entries: (query.data?.entries ?? EMPTY_LIST) as StreakLeaderboardEntry[],
    totalParticipants: query.data?.totalParticipants ?? 0,
    isLoading: query.isLoading,
    isPlaceholderData: query.isPlaceholderData,
    isError: query.isError,
  };
}
