import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createOrUpdateUserTarget,
  deleteUserTarget,
} from '~/shared/api/userTargetApi';
import { targetDashboardKeys } from './useTargetDashboard';
import { targetAchievedKeys } from './useTargetAchieved';
import { generatePlanKeys } from '../../learning-plans/pages/hooks/useGeneratePlan';

// Các truy vấn đang hiển thị mục tiêu theo examTypeId (dashboard, đã đạt, trang sinh lộ trình,
// và mục tiêu hiện tại ở trang Mục tiêu của tôi).
const invalidateTargetQueries = (qc, examTypeId) => {
  qc.invalidateQueries({ queryKey: targetDashboardKeys.dashboard(examTypeId) });
  qc.invalidateQueries({ queryKey: targetAchievedKeys.detail(examTypeId) });
  qc.invalidateQueries({ queryKey: generatePlanKeys.target(examTypeId) });
  qc.invalidateQueries({ queryKey: ['user-target', examTypeId] });
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
