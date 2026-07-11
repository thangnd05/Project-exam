import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitSession } from '~/shared/api/learningPlanApi';
import { planDetailKeys } from './usePlanDetail';
import { taskHistoryKeys } from './useTaskHistory';

export function useSubmitSession({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ learningPlanId, sessionId, answers }) =>
      submitSession(learningPlanId, sessionId, answers),
    onSuccess: (data, variables, ...rest) => {
      const { learningPlanId } = variables;
      qc.invalidateQueries({ queryKey: planDetailKeys.detail(learningPlanId) });
      qc.invalidateQueries({ queryKey: taskHistoryKeys.plan(learningPlanId) });
      // Prefix của taskHistoryKeys.sessions(planId, taskId) -> refresh lịch sử phiên của mọi ải trong plan.
      qc.invalidateQueries({ queryKey: ['task-sessions', learningPlanId] });
      onSuccess?.(data, variables, ...rest);
    },
    onError,
  });
}
