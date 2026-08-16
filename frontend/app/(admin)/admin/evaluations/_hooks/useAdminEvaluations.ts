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
import type {EvaluationRequest, EvaluationResponse, PageResponse} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export interface AdminEvaluation {
  id: string;
  content: string;
  rating: number;
  created_at: string | null;
  user_id: string;
  username: string;
}

interface EvaluationListParams {
  page: number;
  size: number;
  keyword: string;
  rating: number | string;
}

export const evaluationKeys = {
  all: ['evaluations'] as const,
  list: (params: EvaluationListParams) => ['evaluations', 'list', params] as const,
};

const normalizeEvaluation = (evaluation: EvaluationResponse): AdminEvaluation => ({
  id: String(evaluation.id),
  content: evaluation.content || '',
  rating: Number(evaluation.rating || 0),
  created_at: evaluation.createdAt || null,
  user_id: evaluation.userId ? String(evaluation.userId) : '',
  username: evaluation.username || 'Ẩn danh',
});

const normalizePage = (evaluationPage: PageResponse<EvaluationResponse>) => ({
  list: (evaluationPage?.content || []).map(normalizeEvaluation),
  totalElements: evaluationPage?.totalElements || 0,
  totalPages: Math.max(evaluationPage?.totalPages || 1, 1),
});

export function useAdminEvaluations({page, size, keyword, rating}: EvaluationListParams) {
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
    evaluationList: query.data?.list ?? EMPTY_LIST,
    totalElements: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 1,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useEvaluationMutations() {
  const {createMutation, updateMutation, deleteMutation} = useCrudMutations({
    queryKey: evaluationKeys.all,
    create: (payload: EvaluationRequest) => createEvaluation(payload),
    update: ({id, payload}: {id: string; payload: EvaluationRequest}) => updateEvaluation(id, payload),
    remove: (id: string) => deleteEvaluation(id),
  });

  return {createMutation, updateMutation, deleteMutation};
}
