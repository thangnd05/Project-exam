'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentSession, startTaskSession } from '~/shared/api/learningPlanApi';
import { getApiErrorMessage } from '~/shared/utils/apiError';

export const planSessionKeys = {
  session: (learningPlanId, taskId) => ['plan-session', learningPlanId, taskId || null],
};

export function usePlanSession(learningPlanId, taskId) {
  const query = useQuery({
    queryKey: planSessionKeys.session(learningPlanId, taskId),
    queryFn: () =>
      taskId
        ? startTaskSession(learningPlanId, taskId)
        : getCurrentSession(learningPlanId),
    enabled: !!learningPlanId,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    session: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.isError ? getApiErrorMessage(query.error) : null,
  };
}
