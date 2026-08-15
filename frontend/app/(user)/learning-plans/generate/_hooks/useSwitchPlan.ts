'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { switchPlan } from '@/app/apis/learningPlanApi';
import { invalidatePlanQueries } from '@/app/hooks/plan-cache';

type UseSwitchPlanOptions = {
  onSuccess?: (...args: unknown[]) => void;
  // err để any có chủ đích: lỗi Axios, caller đọc err.response.data.message (BE không có type lỗi)
  onError?: (err: any) => void;
};

export function useSwitchPlan({ onSuccess, onError }: UseSwitchPlanOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (learningPlanId: string) => switchPlan(learningPlanId),
    onSuccess: (...args) => {
      invalidatePlanQueries(qc);
      onSuccess?.(...args);
    },
    onError,
  });
}
