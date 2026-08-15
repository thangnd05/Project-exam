'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentSession } from '@/app/apis/learningPlanApi';
import { getApiErrorMessage } from '@/app/utils/apiError';

export const planResultKeys = {
  result: (learningPlanId, taskId) => ['plan-result', learningPlanId, taskId],
};

export function usePlanResult(learningPlanId, taskId) {
  const query = useQuery({
    queryKey: planResultKeys.result(learningPlanId, taskId),
    queryFn: () => getCurrentSession(learningPlanId, taskId, true),
    enabled: !!learningPlanId && !!taskId,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    result: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.isError ? getApiErrorMessage(query.error) : null,
  };
}
