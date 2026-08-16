'use client';

import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { createEvaluation, getAllEvaluations } from '@/app/apis/evaluationApi';
import type { EvaluationRequest, EvaluationResponse } from '@/app/types/attempt';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const evaluationKeys = { all: ['evaluations'] };

const normalizeEvaluations = (data: EvaluationResponse[]): EvaluationResponse[] => {
  if (Array.isArray(data)) return data;
  console.error('API evaluations returned non-array data:', data);
  return [];
};

export function useEvaluations() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: evaluationKeys.all,
    queryFn: getAllEvaluations,
    select: normalizeEvaluations,
  });

  const refetchEvaluations = () =>
    qc.invalidateQueries({ queryKey: evaluationKeys.all });

  return {
    reviews: query.data ?? EMPTY_LIST,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: refetchEvaluations,
  };
}

type UseCreateEvaluationOptions = Pick<
  UseMutationOptions<EvaluationResponse, any, EvaluationRequest>,
  'onSuccess' | 'onError'
>;

export function useCreateEvaluation({ onSuccess, onError }: UseCreateEvaluationOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EvaluationRequest) => createEvaluation(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: evaluationKeys.all });
      onSuccess?.(...args);
    },
    onError,
  });
}
