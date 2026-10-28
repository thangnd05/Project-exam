'use client';

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  createOrUpdateUserTarget,
  deleteUserTarget,
} from '@/app/apis/userTargetApi';
import type { UserTargetRequest } from '@/app/types';
import { targetDashboardKeys } from '@/app/features/my-target/hooks/useTargetDashboard';
import { targetAchievedKeys } from '@/app/features/my-target/hooks/useTargetAchieved';
import { invalidatePlanQueries } from '@/app/features/learning-plans/plan-cache';
import {userTargetKeys} from '@/app/configs/queryKeys';

type MutationCallbacks = {
  onSuccess?: (...args: unknown[]) => void;
  onError?: (...args: unknown[]) => void;
};

const invalidateTargetQueries = (qc: QueryClient, examTypeId?: string) => {
  qc.invalidateQueries({ queryKey: targetDashboardKeys.dashboard(examTypeId) });
  qc.invalidateQueries({ queryKey: targetAchievedKeys.detail(examTypeId) });
  qc.invalidateQueries({ queryKey: userTargetKeys.byExamType(examTypeId) });
  invalidatePlanQueries(qc);
};

export function useSaveUserTarget({ onSuccess, onError }: MutationCallbacks = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserTargetRequest) => createOrUpdateUserTarget(payload),
    onSuccess: (data, variables, ...rest: unknown[]) => {
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
    onSuccess: (data, examTypeId, ...rest: unknown[]) => {
      invalidateTargetQueries(qc, examTypeId);
      onSuccess?.(data, examTypeId, ...rest);
    },
    onError,
  });
}
