'use client';

import {useQuery} from '@tanstack/react-query';
import {isAxiosError} from 'axios';
import {useTranslations} from 'next-intl';

import {getLeaderboardByTest} from '@/app/apis/userTestApi';
import type {LeaderboardMyRank, TestLeaderboardResponse, UserTestResponse} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const testLeaderboardKeys = {
  leaderboard: (id?: string) => ['test-leaderboard', id],
};

export type LeaderboardRow = UserTestResponse & {
  fullName?: string;
  username?: string;
  displayName?: string;
  score?: number;
};

const normalizeLeaderboard = (data: TestLeaderboardResponse) => {
  const entries = (Array.isArray(data?.entries) ? data.entries : []) as LeaderboardRow[];
  return {
    entries,
    me: (data?.me ?? null) as LeaderboardMyRank | null,
    totalParticipants:
      typeof data?.totalParticipants === 'number'
        ? data.totalParticipants
        : entries.length,
  };
};

export function useTestLeaderboard(testId?: string) {
  const t = useTranslations('TestTaking.leaderboard');
  const leaderboardQuery = useQuery({
    queryKey: testLeaderboardKeys.leaderboard(testId),
    queryFn: () => getLeaderboardByTest(testId as string),
    enabled: !!testId,
    select: normalizeLeaderboard,
  });

  const leaderboard = leaderboardQuery.data;

  let errorMessage = '';
  if (leaderboardQuery.isError) {
    errorMessage =
      isAxiosError(leaderboardQuery.error) && leaderboardQuery.error.response?.status === 403
        ? t('forbidden')
        : t('loadError');
  }

  return {
    rawRows: leaderboard?.entries ?? EMPTY_LIST,
    me: leaderboard?.me ?? null,
    totalParticipants: leaderboard?.totalParticipants ?? 0,
    errorMessage,
    isLoading: leaderboardQuery.isLoading,
  };
}
