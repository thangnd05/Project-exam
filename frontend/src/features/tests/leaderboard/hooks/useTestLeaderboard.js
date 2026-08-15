'use client';

import {useQuery} from '@tanstack/react-query';

import {getLeaderboardByTest} from '~/shared/api/userTestApi';
import {getUserTestInfo} from '~/shared/api/testApi';

export const testLeaderboardKeys = {
  info: (id) => ['test-info', id],
  leaderboard: (id) => ['test-leaderboard', id],
};

const normalizeLeaderboard = (data) => {
  const entries = Array.isArray(data?.entries) ? data.entries : [];
  return {
    entries,
    me: data?.me ?? null,
    totalParticipants:
      typeof data?.totalParticipants === 'number'
        ? data.totalParticipants
        : entries.length,
  };
};

export function useTestLeaderboard(testId) {
  const infoQuery = useQuery({
    queryKey: testLeaderboardKeys.info(testId),
    queryFn: () => getUserTestInfo(testId),
    enabled: !!testId,
    select: (data) => data?.title || '',
  });

  const leaderboardQuery = useQuery({
    queryKey: testLeaderboardKeys.leaderboard(testId),
    queryFn: () => getLeaderboardByTest(testId),
    enabled: !!testId,
    select: normalizeLeaderboard,
  });

  const leaderboard = leaderboardQuery.data;

  let errorMessage = '';
  if (leaderboardQuery.isError) {
    errorMessage =
      leaderboardQuery.error?.response?.status === 403
        ? 'Bạn không có quyền xem bảng xếp hạng của đề này (đề thuộc lớp riêng).'
        : 'Không tải được bảng xếp hạng từ hệ thống.';
  }

  return {
    testTitle: infoQuery.data ?? '',
    rawRows: leaderboard?.entries ?? [],
    me: leaderboard?.me ?? null,
    totalParticipants: leaderboard?.totalParticipants ?? 0,
    errorMessage,
    isLoading: infoQuery.isLoading || leaderboardQuery.isLoading,
  };
}
