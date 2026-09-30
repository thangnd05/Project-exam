'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  bulkUpdateQuestions,
  deleteQuestion,
  searchAdminQuestions,
} from '@/app/apis/questionApi';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import { getExamPartsByExamType } from '@/app/apis/examPartApi';
import { getTagsFlatByExamType } from '@/app/apis/tagApi';
import type {
  AdminQuestionListItem,
  AdminQuestionSearchParams,
  BulkUpdateQuestionsRequest,
  ExamPartResponse,
  ExamTypeResponse,
  TagResponse,
} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const adminQuestionKeys = {
  root: ['admin-questions'] as const,
  list: (params: AdminQuestionSearchParams) => ['admin-questions', 'list', params] as const,
  examTypes: ['admin-questions', 'exam-types'] as const,
  parts: (examTypeId: string) => ['admin-questions', 'parts', examTypeId] as const,
  tags: (examTypeId: string) => ['admin-questions', 'tags', examTypeId] as const,
};

const normalizeArray = <T,>(data: T[] | { content?: T[] } | null | undefined): T[] =>
  Array.isArray(data) ? data : data?.content ?? [];

export function useAdminQuestionList(params: AdminQuestionSearchParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: adminQuestionKeys.list(params),
    queryFn: () => searchAdminQuestions(params),
  });

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: adminQuestionKeys.root });

  const bulkUpdateMutation = useMutation({
    mutationFn: (payload: BulkUpdateQuestionsRequest) => bulkUpdateQuestions(payload),
    onSuccess: invalidateList,
  });

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) => deleteQuestion(questionId),
    onSuccess: invalidateList,
  });

  return {
    questions: (listQuery.data?.content ?? EMPTY_LIST) as AdminQuestionListItem[],
    totalPages: listQuery.data?.totalPages ?? 0,
    totalElements: listQuery.data?.totalElements ?? 0,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    bulkUpdateMutation,
    deleteMutation,
    invalidateList,
  };
}

export function useQuestionFilterOptions(examTypeId: string) {
  const examTypesQuery = useQuery({
    queryKey: adminQuestionKeys.examTypes,
    queryFn: getStandardExamTypes,
    select: normalizeArray,
  });

  const partsQuery = useQuery({
    queryKey: adminQuestionKeys.parts(examTypeId),
    queryFn: () => getExamPartsByExamType(examTypeId),
    enabled: !!examTypeId,
    select: normalizeArray,
  });

  const tagsQuery = useQuery({
    queryKey: adminQuestionKeys.tags(examTypeId),
    queryFn: () => getTagsFlatByExamType(examTypeId),
    enabled: !!examTypeId,
    select: normalizeArray,
  });

  return {
    examTypes: (examTypesQuery.data ?? EMPTY_LIST) as ExamTypeResponse[],
    examParts: (examTypeId ? partsQuery.data ?? EMPTY_LIST : EMPTY_LIST) as ExamPartResponse[],
    tags: (examTypeId ? tagsQuery.data ?? EMPTY_LIST : EMPTY_LIST) as TagResponse[],
    isLoading: examTypesQuery.isLoading,
  };
}
