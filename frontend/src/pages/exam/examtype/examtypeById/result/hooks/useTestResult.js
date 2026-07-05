import { useQuery } from '@tanstack/react-query';
import { getUserTestMeta } from '~/api/userTestApi';
import { getResultByUserTest } from '~/api/userAnswerApi';
import { getUserTestInfo } from '~/api/testApi';
import { getEnhancedResult, getGuestEnhancedResult } from '~/api/enhancedResultApi';

export const testResultKeys = {
  result: (userTestId, isGuest) => ['test-result', userTestId, isGuest],
};

const fetchTestResult = async (userTestId, isGuest, guestCfg) => {
  // 1. Lấy thông tin tổng quan bài test (Chứa startedAt, finishedAt)
  const metaData = await getUserTestMeta(userTestId, isGuest, guestCfg);

  // 2. Lấy kết quả điểm số, số câu đúng/sai
  const resultData = await getResultByUserTest(userTestId, isGuest, guestCfg);

  const result = {
    ...resultData,
    startedAt: metaData.startedAt,
    finishedAt: metaData.finishedAt,
  };

  // 3. Check hạn review (endpoint public)
  const testData = await getUserTestInfo(metaData.testId);
  const now = new Date();
  const availableTo = testData.availableTo ? new Date(testData.availableTo) : null;
  const canReview = !availableTo || now > availableTo;

  // 4. Fetch enhanced result (non-blocking)
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
