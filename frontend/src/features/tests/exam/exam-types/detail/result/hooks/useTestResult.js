'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserTestMeta } from '~/shared/api/userTestApi';
import { getResultByUserTest } from '~/shared/api/userAnswerApi';
import { getUserTestInfo } from '~/shared/api/testApi';
import { getEnhancedResult, getGuestEnhancedResult } from '~/shared/api/enhancedResultApi';

export const testResultKeys = {
  result: (userTestId, isGuest) => ['test-result', userTestId, isGuest],
};

const fetchTestResult = async (userTestId, isGuest, guestCfg) => {

  const metaData = await getUserTestMeta(userTestId, isGuest, guestCfg);

  const resultData = await getResultByUserTest(userTestId, isGuest, guestCfg);

  const result = {
    ...resultData,
    startedAt: metaData.startedAt,
    finishedAt: metaData.finishedAt,
  };

  const testData = await getUserTestInfo(metaData.testId);
  const now = new Date();
  const availableTo = testData.availableTo ? new Date(testData.availableTo) : null;
  const canReview = !availableTo || now > availableTo;

  let enhanced = null;
  try {
    const enhancedRes = isGuest
      ? await getGuestEnhancedResult(userTestId)
      : await getEnhancedResult(userTestId);
    enhanced = enhancedRes.data;
  } catch (enhErr) {
    console.warn('Enhanced result not available:', enhErr);
  }

  return { result, testId: metaData.testId, canReview, enhanced };
};

export function useTestResult(userTestId, isGuest, guestCfg, enabled = true) {
  const query = useQuery({
    queryKey: testResultKeys.result(userTestId, isGuest),
    queryFn: () => fetchTestResult(userTestId, isGuest, guestCfg),
    enabled: !!userTestId && enabled,
  });

  return {
    result: query.data?.result ?? null,
    testId: query.data?.testId ?? null,
    canReview: query.data?.canReview ?? false,
    enhanced: query.data?.enhanced ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
