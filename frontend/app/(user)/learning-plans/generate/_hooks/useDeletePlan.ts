'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePlan } from '@/app/apis/learningPlanApi';
import { invalidatePlanQueries } from '@/app/hooks/plan-cache';

type UseDeletePlanOptions = {
  onSuccess?: (...args: unknown[]) => void;
  onError?: (err: any) => void;
};

export function useDeletePlan({ onSuccess, onError }: UseDeletePlanOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (learningPlanId: string) => deletePlan(learningPlanId),
    onSuccess: (...args) => {
      invalidatePlanQueries(qc);
      onSuccess?.(...args);
    },
    onError,
  });
}
