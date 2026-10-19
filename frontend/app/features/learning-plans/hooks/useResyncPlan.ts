'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resyncPlan } from '@/app/apis/learningPlanApi';
import type { ApiError, PlanResponse } from '@/app/types';
import { invalidatePlanQueries } from '@/app/features/learning-plans/plan-cache';

type UseResyncPlanOptions = {
  onSuccess?: (data: PlanResponse, ...rest: unknown[]) => void;
  onError?: (err: ApiError) => void;
};

export function useResyncPlan({ onSuccess, onError }: UseResyncPlanOptions = {}) {
  const qc = useQueryClient();
  return useMutation<PlanResponse, ApiError, string>({
    mutationFn: (learningPlanId: string) => resyncPlan(learningPlanId),
    onSuccess: (...args) => {
      invalidatePlanQueries(qc);
      onSuccess?.(...args);
    },
    onError,
  });
}
