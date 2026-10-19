'use client';

import {useQuery} from '@tanstack/react-query';
import {keepPreviousData} from '@/app/configs/queryClient';

import {
  deleteEvaluation,
  getAdminEvaluations,
  getEvaluationStatsByTest,
} from '@/app/apis/evaluationApi';
import {useCrudMutations} from '@/app/(admin)/_hooks/useAdminCrud';
import type {EvaluationResponse, PageResponse} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export interface AdminEvaluation {
  id: string;
  content: string;
  rating: number;
  created_at: string | null;
  user_id: string;
  username: string;
  test_id: string | null;
  test_title: string | null;
}

interface EvaluationListParams {
  page: number;
  size: number;
  keyword: string;
  rating: number | string;
  testId: string;
}

export const evaluationKeys = {
  all: ['admin-evaluations'] as const,
  list: (params: EvaluationListParams) => ['admin-evaluations', 'list', params] as const,
  stats: ['admin-evaluations', 'stats'] as const,
};

const normalizeEvaluation = (evaluation: EvaluationResponse): AdminEvaluation => ({
  id: String(evaluation.id),
  content: evaluation.content || '',
  rating: Number(evaluation.rating || 0),
  created_at: evaluation.createdAt || null,
  user_id: evaluation.userId ? String(evaluation.userId) : '',
  username: evaluation.username || 'Ẩn danh',
  test_id: evaluation.testId ?? null,
  test_title: evaluation.testTitle ?? null,
});

const normalizePage = (evaluationPage: PageResponse<EvaluationResponse>) => ({
  list: (evaluationPage?.content || []).map(normalizeEvaluation),
  totalElements: evaluationPage?.totalElements || 0,
  totalPages: Math.max(evaluationPage?.totalPages || 1, 1),
});

export function useAdminEvaluations({page, size, keyword, rating, testId}: EvaluationListParams) {
  const query = useQuery({
    queryKey: evaluationKeys.list({page, size, keyword, rating, testId}),
    queryFn: () =>
      getAdminEvaluations({
        page: Math.max(page - 1, 0),
        size,
        keyword,
        rating,
        testId,
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

export function useEvaluationStats() {
  const query = useQuery({
    queryKey: evaluationKeys.stats,
    queryFn: getEvaluationStatsByTest,
  });

  return {
    stats: query.data ?? EMPTY_LIST,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useEvaluationMutations() {
  const {deleteMutation} = useCrudMutations({
    queryKey: evaluationKeys.all,
    remove: (id: string) => deleteEvaluation(id),
  });

  return {deleteMutation};
}
