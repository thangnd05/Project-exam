import { useQuery } from '@tanstack/react-query';
import { getMyUserTests } from '~/api/userTestApi';
import { getExamTypes } from '~/api/examTypeApi';
import { getUserTarget } from '~/api/userTargetApi';
import { listPlans, getPlanById } from '~/api/learningPlanApi';
import { getEnhancedResult } from '~/api/enhancedResultApi';
import { filterCompletedTests } from '~/utils/userTests';

export const nextStepKeys = {
  examTypes: ['exam-types'],
  overview: (examTypeId) => ['next-step-overview', examTypeId],
};

async function fetchOverview(examTypeId) {
  const target = await getUserTarget(examTypeId).catch(() => null);

  const plans = (await listPlans(examTypeId).catch(() => [])) || [];
  const active = plans.find((p) => p.status === 'ACTIVE');
  const activePlanDetail = active
    ? await getPlanById(active.learningPlanId).catch(() => null)
    : null;

  const completed = filterCompletedTests(await getMyUserTests(), examTypeId);
  const latestMock = completed[0] || null;

  let enhanced = null;
  if (latestMock?.userTestId) {
    try {
      const r = await getEnhancedResult(latestMock.userTestId);
      enhanced = r.data;
    } catch {
      enhanced = null;
    }
  }

  return { target, plans, activePlanDetail, latestMock, enhanced };
}

export function useExamTypes() {
  return useQuery({
    queryKey: nextStepKeys.examTypes,
    queryFn: getExamTypes,
  });
}

export function useNextStepOverview(examTypeId) {
  return useQuery({
    queryKey: nextStepKeys.overview(examTypeId),
    queryFn: () => fetchOverview(examTypeId),
    enabled: !!examTypeId,
  });
}
