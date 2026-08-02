import { useQuery } from '@tanstack/react-query';
import { getUserTestMeta } from '~/shared/api/userTestApi';
import { getAnswersByUserTest } from '~/shared/api/userAnswerApi';
import { getUserTestInfo, getAdminTestById } from '~/shared/api/testApi';

export const testReviewKeys = {
  detail: (userTestId, isGuest) => ['test-review', userTestId, isGuest],
};

async function fetchTestReview(userTestId, isGuest, guestCfg) {
  const metaData = await getUserTestMeta(userTestId, isGuest, guestCfg);
  const testId = metaData.testId;

  const testInfo = await getUserTestInfo(testId);
  const now = new Date();
  const availableTo = testInfo.availableTo ? new Date(testInfo.availableTo) : null;
  const reviewable = !availableTo || now > availableTo;

  if (!reviewable) {
    return { test: null, userAnswers: [], canReview: false, notReviewable: true };
  }

  const [testData, answersData] = await Promise.all([
    getAdminTestById(testId),
    getAnswersByUserTest(userTestId, isGuest, guestCfg),
  ]);

  let parts = testData.parts || [];
  if (metaData.mode === 'PRACTICE' && metaData.practicePartIds?.length) {
    const practiced = new Set(metaData.practicePartIds.map(String));
    parts = parts.filter((p) => practiced.has(String(p.examPartId)));
  }

  return {
    test: { ...testData, parts },
    userAnswers: Array.isArray(answersData) ? answersData : [],
    canReview: true,
    notReviewable: false,
  };
}

export function useTestReview(
  userTestId,
  { enabled = true, isGuest = false, guestCfg = {} } = {},
) {
  return useQuery({
    queryKey: testReviewKeys.detail(userTestId, isGuest),
    queryFn: () => fetchTestReview(userTestId, isGuest, guestCfg),
    enabled: enabled && !!userTestId,
  });
}
