import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createOrUpdateUserTarget,
  deleteUserTarget,
} from '~/shared/api/userTargetApi';
import { targetDashboardKeys } from '~/features/diagnostic/target/hooks/useTargetDashboard';
import { targetAchievedKeys } from '~/features/diagnostic/target/hooks/useTargetAchieved';
import { generatePlanKeys } from '~/features/diagnostic/learning-plans/hooks/useGeneratePlan';
import { invalidatePlanQueries } from '~/features/diagnostic/learning-plans/hooks/plan-cache';

// Các truy vấn đang hiển thị mục tiêu theo examTypeId (dashboard, đã đạt, trang sinh lộ trình,
// và mục tiêu hiện tại ở trang Mục tiêu của tôi). Kèm cả các query plan vì đổi/xoá mục tiêu
// có thể khiến lộ trình đang chạy trở thành "outdated" (BE tính lại cờ targetOutdated).
const invalidateTargetQueries = (qc, examTypeId) => {
  qc.invalidateQueries({ queryKey: targetDashboardKeys.dashboard(examTypeId) });
  qc.invalidateQueries({ queryKey: targetAchievedKeys.detail(examTypeId) });
  qc.invalidateQueries({ queryKey: generatePlanKeys.target(examTypeId) });
  qc.invalidateQueries({ queryKey: ['user-target', examTypeId] });
  invalidatePlanQueries(qc);
};

export function useSaveUserTarget({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createOrUpdateUserTarget(payload),
    onSuccess: (data, variables, ...rest) => {
      invalidateTargetQueries(qc, variables?.examTypeId);
      onSuccess?.(data, variables, ...rest);
    },
    onError,
  });
}

export function useDeleteUserTarget({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (examTypeId) => deleteUserTarget(examTypeId),
    onSuccess: (data, examTypeId, ...rest) => {
      invalidateTargetQueries(qc, examTypeId);
      onSuccess?.(data, examTypeId, ...rest);
    },
    onError,
  });
}
