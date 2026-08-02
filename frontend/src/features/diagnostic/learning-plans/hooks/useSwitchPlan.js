import { useMutation, useQueryClient } from '@tanstack/react-query';
import { switchPlan } from '~/shared/api/learningPlanApi';
import { invalidatePlanQueries } from '~/features/diagnostic/learning-plans/hooks/plan-cache';

export function useSwitchPlan({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (learningPlanId) => switchPlan(learningPlanId),
    onSuccess: (...args) => {
      invalidatePlanQueries(qc);
      onSuccess?.(...args);
    },
    onError,
  });
}
