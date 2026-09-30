'use client';

import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import { getUserTestMeta } from '@/app/apis/userTestApi';
import { getResultByUserTest } from '@/app/apis/userAnswerApi';
import { getUserTestInfo } from '@/app/apis/testApi';
import { getEnhancedResult, getGuestEnhancedResult } from '@/app/apis/enhancedResultApi';
import { isMockAttempt } from '@/app/utils/planLabels';
import type { EnhancedResultResponse, ResultSummaryResponse } from '@/app/types';

export type TestResultSummary = ResultSummaryResponse & {
  startedAt?: string;
  finishedAt?: string;
};

export const testResultKeys = {
  result: (userTestId?: string, isGuest?: boolean) => ['test-result', userTestId, isGuest],
};

const fetchTestResult = async (
  userTestId: string,
  isGuest: boolean,
  guestCfg: AxiosRequestConfig,
) => {

  const metaData = await getUserTestMeta(userTestId, isGuest, guestCfg);

  const resultData = await getResultByUserTest(userTestId, isGuest, guestCfg);

  const result: TestResultSummary = {
    ...resultData,
    startedAt: metaData.startedAt,
    finishedAt: metaData.finishedAt,
  };

  const testData = await getUserTestInfo(metaData.testId as string);
  const now = new Date();
  const availableTo = testData.availableTo ? new Date(testData.availableTo) : null;
  const canReview = !availableTo || now > availableTo;

  let enhanced: EnhancedResultResponse | null = null;
  try {
    const enhancedRes = isGuest
      ? await getGuestEnhancedResult(userTestId)
      : await getEnhancedResult(userTestId);
    enhanced = enhancedRes.data;
  } catch (enhErr) {
    console.warn('Enhanced result not available:', enhErr);
  }

  // Bài luyện theo phần: danh sách Part đã luyện; null với bài thi thử.
  const practicePartIds = isMockAttempt(metaData) ? null : (metaData.practicePartIds ?? []);

  return { result, testId: metaData.testId ?? null, canReview, enhanced, practicePartIds };
};

export function useTestResult(
  userTestId: string | undefined,
  isGuest: boolean,
  guestCfg: AxiosRequestConfig,
  enabled = true,
) {
  const query = useQuery({
    queryKey: testResultKeys.result(userTestId, isGuest),
    queryFn: () => fetchTestResult(userTestId as string, isGuest, guestCfg),
    enabled: !!userTestId && enabled,
  });

  return {
    result: query.data?.result ?? null,
    testId: query.data?.testId ?? null,
    canReview: query.data?.canReview ?? false,
    enhanced: query.data?.enhanced ?? null,
    practicePartIds: query.data?.practicePartIds ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
