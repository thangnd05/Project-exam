'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyAttemptsByTest } from '~/shared/api/userTestApi';
import { getUserTestInfo } from '~/shared/api/testApi';

export const testHistoryKeys = {
  attempts: (testId) => ['test-attempts', testId],
  info: (testId) => ['test-info', testId],
};

const normalizeAttempts = (payload) =>
  Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

export function useTestHistory(testId) {
  const attemptsQuery = useQuery({
    queryKey: testHistoryKeys.attempts(testId),
    queryFn: () => getMyAttemptsByTest(testId),
    enabled: !!testId,
    select: normalizeAttempts,
  });

  const infoQuery = useQuery({
    queryKey: testHistoryKeys.info(testId),
    queryFn: () => getUserTestInfo(testId),
    enabled: !!testId,
  });

  return {
    attempts: attemptsQuery.data ?? [],
    testInfo: infoQuery.data ?? null,
    isLoading: attemptsQuery.isLoading || infoQuery.isLoading,
  };
}
