'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePlan } from '@/app/apis/learningPlanApi';
import { invalidatePlanQueries } from '@/app/features/diagnostic/learning-plans/hooks/plan-cache';

export function useDeletePlan({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (learningPlanId) => deletePlan(learningPlanId),
    onSuccess: (...args) => {
      invalidatePlanQueries(qc);
      onSuccess?.(...args);
    },
    onError,
  });
}
