'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitSession } from '~/shared/api/learningPlanApi';
import { planDetailKeys } from '~/features/diagnostic/learning-plans/hooks/usePlanDetail';
import { invalidatePlanQueries } from '~/features/diagnostic/learning-plans/hooks/plan-cache';

export function useSubmitSession({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ learningPlanId, sessionId, answers }) =>
      submitSession(learningPlanId, sessionId, answers),
    onSuccess: (data, variables, ...rest) => {
      const { learningPlanId } = variables;
      qc.invalidateQueries({ queryKey: planDetailKeys.detail(learningPlanId) });

      qc.invalidateQueries({ queryKey: ['task-sessions', learningPlanId] });

      invalidatePlanQueries(qc);
      onSuccess?.(data, variables, ...rest);
    },
    onError,
  });
}
