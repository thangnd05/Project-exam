import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitSession } from '~/shared/api/learningPlanApi';
import { planDetailKeys } from './usePlanDetail';
import { taskHistoryKeys } from './useTaskHistory';
import { invalidatePlanQueries } from '../../hooks/plan-cache';

export function useSubmitSession({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ learningPlanId, sessionId, answers }) =>
      submitSession(learningPlanId, sessionId, answers),
    onSuccess: (data, variables, ...rest) => {
      const { learningPlanId } = variables;
      qc.invalidateQueries({ queryKey: planDetailKeys.detail(learningPlanId) });
      // Prefix của taskHistoryKeys.sessions(planId, taskId) -> refresh lịch sử phiên của mọi ải trong plan.
      qc.invalidateQueries({ queryKey: ['task-sessions', learningPlanId] });
      // Vượt ải làm đổi tiến độ hiển thị ở danh sách lộ trình và tổng quan mục tiêu.
      // (KHÔNG đụng key 'plan-session': nó gọi endpoint tạo phiên, invalidate sẽ mở phiên mới.)
      invalidatePlanQueries(qc);
      onSuccess?.(data, variables, ...rest);
    },
    onError,
  });
}
