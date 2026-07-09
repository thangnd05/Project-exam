import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllEvaluations } from '~/api/evaluationApi';

export const evaluationKeys = { all: ['evaluations'] };

const normalizeEvaluations = (data) => {
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
    reviews: query.data ?? [],
    loading: query.isLoading,
    refetchEvaluations,
  };
}
