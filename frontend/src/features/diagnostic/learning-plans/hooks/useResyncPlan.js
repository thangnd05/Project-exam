import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resyncPlan } from '~/shared/api/learningPlanApi';
import { invalidatePlanQueries } from '~/features/diagnostic/learning-plans/hooks/plan-cache';

/** Sinh lại lộ trình theo mục tiêu mới từ bài chẩn đoán cũ, giữ tiến độ ải trùng. */
export function useResyncPlan({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (learningPlanId) => resyncPlan(learningPlanId),
    onSuccess: (...args) => {
      invalidatePlanQueries(qc);
      onSuccess?.(...args);
    },
    onError,
  });
}
