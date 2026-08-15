'use client';

import {useQuery} from '@tanstack/react-query';
import {keepPreviousData} from '@/app/configs/queryClient';

import {
  createEvaluation,
  deleteEvaluation,
  getEvaluations,
  updateEvaluation,
} from '@/app/apis/evaluationApi';
import {useCrudMutations} from '@/app/hooks/useAdminCrud';

export const evaluationKeys = {
  all: ['evaluations'],
  list: (params) => ['evaluations', 'list', params],
};

const normalizeEvaluation = (evaluation) => ({
  id: String(evaluation.id),
  content: evaluation.content || '',
  rating: Number(evaluation.rating || 0),
  created_at: evaluation.createdAt || null,
  user_id: evaluation.userId ? String(evaluation.userId) : '',
  username: evaluation.username || 'Ẩn danh',
});

const normalizePage = (evaluationPage) => ({
  list: (evaluationPage?.content || []).map(normalizeEvaluation),
  totalElements: evaluationPage?.totalElements || 0,
  totalPages: Math.max(evaluationPage?.totalPages || 1, 1),
});

export function useAdminEvaluations({page, size, keyword, rating}) {
  const query = useQuery({
    queryKey: evaluationKeys.list({page, size, keyword, rating}),
    queryFn: () =>
      getEvaluations({
        page: Math.max(page - 1, 0),
        size,
        keyword,
        rating,
      }),
    placeholderData: keepPreviousData,
    select: normalizePage,
  });

  return {
    evaluationList: query.data?.list ?? [],
    totalElements: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useEvaluationMutations() {
  const {createMutation, updateMutation, deleteMutation} = useCrudMutations({
    queryKey: evaluationKeys.all,
    create: (payload) => createEvaluation(payload),
    update: ({id, payload}) => updateEvaluation(id, payload),
    remove: (id) => deleteEvaluation(id),
  });

  return {createMutation, updateMutation, deleteMutation};
}
