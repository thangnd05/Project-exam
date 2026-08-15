'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resyncPlan } from '@/app/apis/learningPlanApi';
import type { PlanResponse } from '@/app/types';
import { invalidatePlanQueries } from '@/app/hooks/plan-cache';

type UseResyncPlanOptions = {
  onSuccess?: (data: PlanResponse, ...rest: unknown[]) => void;
  // err để any có chủ đích: lỗi Axios, caller đọc err.response.data.message (BE không có type lỗi)
  onError?: (err: any) => void;
};

/** Sinh lại lộ trình theo mục tiêu mới từ bài chẩn đoán cũ, giữ tiến độ ải trùng. */
export function useResyncPlan({ onSuccess, onError }: UseResyncPlanOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (learningPlanId: string) => resyncPlan(learningPlanId),
    onSuccess: (...args) => {
      invalidatePlanQueries(qc);
      onSuccess?.(...args);
    },
    onError,
  });
}
