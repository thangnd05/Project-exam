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
      ? // err any có chủ đích: lỗi Axios, đọc response.data.message (BE không có type lỗi)
        (query.error as any)?.response?.data?.message || query.error.message
      : null,
  };
}
