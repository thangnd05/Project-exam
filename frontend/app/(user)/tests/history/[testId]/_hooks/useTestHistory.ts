'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyAttemptsByTest } from '@/app/apis/userTestApi';
import { getUserTestInfo } from '@/app/apis/testApi';
import type { UserTestResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const testHistoryKeys = {
  attempts: (testId?: string) => ['test-attempts', testId],
  info: (testId?: string) => ['test-info', testId],
};

const normalizeAttempts = (payload: any): UserTestResponse[] =>
  Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

export function useTestHistory(testId?: string) {
  const attemptsQuery = useQuery({
    queryKey: testHistoryKeys.attempts(testId),
    queryFn: () => getMyAttemptsByTest(testId as string),
    enabled: !!testId,
    select: normalizeAttempts,
  });

  const infoQuery = useQuery({
    queryKey: testHistoryKeys.info(testId),
    queryFn: () => getUserTestInfo(testId as string),
    enabled: !!testId,
  });

  return {
    attempts: attemptsQuery.data ?? EMPTY_LIST,
    testInfo: infoQuery.data ?? null,
    isLoading: attemptsQuery.isLoading || infoQuery.isLoading,
  };
}
