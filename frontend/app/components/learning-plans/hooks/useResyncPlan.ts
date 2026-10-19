'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resyncPlan } from '@/app/apis/learningPlanApi';
import type { PlanResponse } from '@/app/types';
import { invalidatePlanQueries } from '@/app/hooks/plan-cache';

type UseResyncPlanOptions = {
  onSuccess?: (data: PlanResponse, ...rest: unknown[]) => void;
  onError?: (err: any) => void;
};

export function useResyncPlan({ onSuccess, onError }: UseResyncPlanOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (learningPlanId: string) => resyncPlan(learningPlanId),
    onSuccess: (...args) => {
      invalidatePlanQueries(qc);
      onSuccess?.(...args);
    },
    onError,
  });
}
