import { useQuery } from '@tanstack/react-query';
import { getCurrentSession } from '~/shared/api/learningPlanApi';

export const planResultKeys = {
  result: (learningPlanId, taskId) => ['plan-result', learningPlanId, taskId],
};

export function usePlanResult(learningPlanId, taskId) {
  return useQuery({
    queryKey: planResultKeys.result(learningPlanId, taskId),
    queryFn: () => getCurrentSession(learningPlanId, taskId, true),
    enabled: !!learningPlanId && !!taskId,
    staleTime: 0,
    gcTime: 0,
  });
}
