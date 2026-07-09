import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyEvaluations, updateEvaluation, deleteEvaluation } from '~/api/evaluationApi';

export const myEvaluationsKeys = {
  list: () => ['my-evaluations'],
};

const normalizeEvaluations = (data) => (Array.isArray(data) ? data : []);

export function useMyEvaluations() {
  const queryClient = useQueryClient();

  const evaluationsQuery = useQuery({
    queryKey: myEvaluationsKeys.list(),
    queryFn: getMyEvaluations,
    select: normalizeEvaluations,
  });

  const updateMutation = useMutation({
    mutationFn: ({ evaluationId, rating, content }) =>
      updateEvaluation(evaluationId, { rating, content }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: myEvaluationsKeys.list() }),
  });

  const deleteMutation = useMutation({
    mutationFn: (evaluationId) => deleteEvaluation(evaluationId),
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
