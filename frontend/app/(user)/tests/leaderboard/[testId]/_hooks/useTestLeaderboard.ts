'use client';

import {useQuery} from '@tanstack/react-query';

import {getLeaderboardByTest} from '@/app/apis/userTestApi';
import {getUserTestInfo} from '@/app/apis/testApi';
import type {LeaderboardMyRank, TestLeaderboardResponse, UserTestResponse} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const testLeaderboardKeys = {
  info: (id?: string) => ['test-info', id],
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
  const infoQuery = useQuery({
    queryKey: testLeaderboardKeys.info(testId),
    queryFn: () => getUserTestInfo(testId as string),
    enabled: !!testId,
    select: (data) => data?.title || '',
  });

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
      (leaderboardQuery.error as any)?.response?.status === 403
        ? 'Bạn không có quyền xem bảng xếp hạng của đề này (đề thuộc lớp riêng).'
        : 'Không tải được bảng xếp hạng từ hệ thống.';
  }

  return {
    testTitle: infoQuery.data ?? '',
    rawRows: leaderboard?.entries ?? EMPTY_LIST,
    me: leaderboard?.me ?? null,
    totalParticipants: leaderboard?.totalParticipants ?? 0,
    errorMessage,
    isLoading: infoQuery.isLoading || leaderboardQuery.isLoading,
  };
}
