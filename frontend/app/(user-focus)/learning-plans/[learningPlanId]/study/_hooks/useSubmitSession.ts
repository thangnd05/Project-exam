'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitSession } from '@/app/apis/learningPlanApi';
import { planDetailKeys } from '@/app/hooks/usePlanDetail';
import { invalidatePlanQueries } from '@/app/hooks/plan-cache';
import type { SubmitSessionAnswerItem, SubmitSessionResponse } from '@/app/types';

type SubmitSessionVariables = {
  learningPlanId: string;
  sessionId: string;
  answers: SubmitSessionAnswerItem[];
};

type UseSubmitSessionOptions = {
  onSuccess?: (data: SubmitSessionResponse, variables: SubmitSessionVariables, ...rest: unknown[]) => void;
  // err để any có chủ đích: lỗi Axios, caller đọc err.response.data.message (BE không có type lỗi)
  onError?: (err: any) => void;
};

export function useSubmitSession({ onSuccess, onError }: UseSubmitSessionOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ learningPlanId, sessionId, answers }: SubmitSessionVariables) =>
      submitSession(learningPlanId, sessionId, answers),
    onSuccess: (data, variables, ...rest) => {
      const { learningPlanId } = variables;
      qc.invalidateQueries({ queryKey: planDetailKeys.detail(learningPlanId) });

      qc.invalidateQueries({ queryKey: ['task-sessions', learningPlanId] });

      invalidatePlanQueries(qc);
      onSuccess?.(data, variables, ...rest);
    },
    onError,
  });
}
