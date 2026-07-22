import { useQuery } from '@tanstack/react-query';
import { getMyCompletedUserTests } from '~/shared/api/userTestApi';
import { getStandardExamTypes } from '~/shared/api/examTypeApi';
import { getUserTarget } from '~/shared/api/userTargetApi';
import { listPlans, getPlanById } from '~/shared/api/learningPlanApi';
import { getEnhancedResult } from '~/shared/api/enhancedResultApi';

export const nextStepKeys = {
  examTypes: ['exam-types', 'standard'],
  overview: (examTypeId) => ['next-step-overview', examTypeId],
};

async function fetchOverview(examTypeId) {
  const target = await getUserTarget(examTypeId).catch(() => null);

  const plans = (await listPlans(examTypeId).catch(() => [])) || [];
  const active = plans.find((p) => p.status === 'ACTIVE');
  const activePlanDetail = active
    ? await getPlanById(active.learningPlanId).catch(() => null)
    : null;

  const completed = await getMyCompletedUserTests(examTypeId);
  const latestCompletedTest = completed[0] || null;

  let enhanced = null;
  if (latestCompletedTest?.userTestId) {
    try {
      const r = await getEnhancedResult(latestCompletedTest.userTestId);
      enhanced = r.data;
    } catch {
      enhanced = null;
    }
  }

  return { target, plans, activePlanDetail, latestCompletedTest, enhanced };
}

export function useExamTypes() {
  return useQuery({
    queryKey: nextStepKeys.examTypes,
    queryFn: getStandardExamTypes,
  });
}

export function useNextStepOverview(examTypeId) {
  return useQuery({
    queryKey: nextStepKeys.overview(examTypeId),
    queryFn: () => fetchOverview(examTypeId),
    enabled: !!examTypeId,
  });
}
