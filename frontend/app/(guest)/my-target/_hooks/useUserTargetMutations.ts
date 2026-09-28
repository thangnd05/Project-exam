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

type MutationCallbacks = {
  onSuccess?: (...args: any[]) => void;
  onError?: (...args: any[]) => void;
};

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
