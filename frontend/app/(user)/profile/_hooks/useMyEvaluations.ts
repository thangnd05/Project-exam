'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyEvaluations, updateEvaluation, deleteEvaluation } from '@/app/apis/evaluationApi';
import type { EvaluationResponse } from '@/app/types';

export const myEvaluationsKeys = {
  list: () => ['my-evaluations'],
};

const normalizeEvaluations = (data: EvaluationResponse[]) => (Array.isArray(data) ? data : []);

interface UpdateEvaluationVariables {
  evaluationId: string;
  rating: number;
  content: string;
}

export function useMyEvaluations() {
  const queryClient = useQueryClient();

  const evaluationsQuery = useQuery({
    queryKey: myEvaluationsKeys.list(),
    queryFn: getMyEvaluations,
    select: normalizeEvaluations,
  });

  const updateMutation = useMutation({
    mutationFn: ({ evaluationId, rating, content }: UpdateEvaluationVariables) =>
      updateEvaluation(evaluationId, { rating, content }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: myEvaluationsKeys.list() }),
  });

  const deleteMutation = useMutation({
    mutationFn: (evaluationId: string) => deleteEvaluation(evaluationId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: myEvaluationsKeys.list() }),
  });

  return {
    evaluations: evaluationsQuery.data ?? [],
    isLoading: evaluationsQuery.isLoading,
    isError: evaluationsQuery.isError,
    updateMutation,
    deleteMutation,
  };
}
