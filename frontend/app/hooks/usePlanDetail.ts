'use client';

import { useQuery } from '@tanstack/react-query';
import { getPlanById } from '@/app/apis/learningPlanApi';

export const planDetailKeys = {
  detail: (learningPlanId?: string) => ['learning-plan-detail', learningPlanId],
};

export function usePlanDetail(learningPlanId?: string) {
  const query = useQuery({
    queryKey: planDetailKeys.detail(learningPlanId),
    queryFn: () => getPlanById(learningPlanId as string),
    enabled: !!learningPlanId,
  });

  return {
    plan: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error
      ? (query.error as any)?.response?.data?.message || query.error.message
      : null,
  };
}
