'use client';

import { useQuery } from '@tanstack/react-query';
import { getPlanById } from '@/app/apis/learningPlanApi';

export const planDetailKeys = {
  detail: (learningPlanId) => ['learning-plan-detail', learningPlanId],
};

export function usePlanDetail(learningPlanId) {
  const query = useQuery({
    queryKey: planDetailKeys.detail(learningPlanId),
    queryFn: () => getPlanById(learningPlanId),
    enabled: !!learningPlanId,
  });

  return {
    plan: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error
      ? query.error?.response?.data?.message || query.error.message
      : null,
  };
}
