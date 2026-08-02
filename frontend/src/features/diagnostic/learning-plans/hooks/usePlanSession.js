import { useQuery } from '@tanstack/react-query';
import { getCurrentSession, startTaskSession } from '~/shared/api/learningPlanApi';

export const planSessionKeys = {
  session: (learningPlanId, taskId) => ['plan-session', learningPlanId, taskId || null],
};

export function usePlanSession(learningPlanId, taskId) {
  return useQuery({
    queryKey: planSessionKeys.session(learningPlanId, taskId),
    queryFn: () => (taskId
      ? startTaskSession(learningPlanId, taskId)
      : getCurrentSession(learningPlanId)),
    enabled: !!learningPlanId,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}
