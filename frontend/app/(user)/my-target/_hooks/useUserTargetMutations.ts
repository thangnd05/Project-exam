'use client';

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  createOrUpdateUserTarget,
  deleteUserTarget,
} from '@/app/apis/userTargetApi';
import type { UserTargetRequest } from '@/app/types';
import { targetDashboardKeys } from '@/app/hooks/useTargetDashboard';
import { targetAchievedKeys } from '@/app/hooks/useTargetAchieved';
import { generatePlanKeys } from '@/app/hooks/useGeneratePlan';
import { invalidatePlanQueries } from '@/app/hooks/plan-cache';

// Callback pass-through giữ nguyên chữ ký linh hoạt của bản .js — any có chủ đích.
type MutationCallbacks = {
  onSuccess?: (...args: any[]) => void;
  onError?: (...args: any[]) => void;
};

// Các truy vấn đang hiển thị mục tiêu theo examTypeId (dashboard, đã đạt, trang sinh lộ trình,
// và mục tiêu hiện tại ở trang Mục tiêu của tôi). Kèm cả các query plan vì đổi/xoá mục tiêu
// có thể khiến lộ trình đang chạy trở thành "outdated" (BE tính lại cờ targetOutdated).
const invalidateTargetQueries = (qc: QueryClient, examTypeId?: string) => {
  qc.invalidateQueries({ queryKey: targetDashboardKeys.dashboard(examTypeId) });
  qc.invalidateQueries({ queryKey: targetAchievedKeys.detail(examTypeId) });
  qc.invalidateQueries({ queryKey: generatePlanKeys.target(examTypeId) });
  qc.invalidateQueries({ queryKey: ['user-target', examTypeId] });
  invalidatePlanQueries(qc);
};

export function useSaveUserTarget({ onSuccess, onError }: MutationCallbacks = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserTargetRequest) => createOrUpdateUserTarget(payload),
    onSuccess: (data, variables, ...rest: any[]) => {
      invalidateTargetQueries(qc, variables?.examTypeId);
      onSuccess?.(data, variables, ...rest);
    },
    onError,
  });
}

export function useDeleteUserTarget({ onSuccess, onError }: MutationCallbacks = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (examTypeId: string) => deleteUserTarget(examTypeId),
    onSuccess: (data, examTypeId, ...rest: any[]) => {
      invalidateTargetQueries(qc, examTypeId);
      onSuccess?.(data, examTypeId, ...rest);
    },
    onError,
  });
}
