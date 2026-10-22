'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createQuestionCollection,
  deleteQuestionCollection,
  getQuestionCollections,
  updateQuestionCollection,
} from '@/app/apis/questionCollectionApi';
import { getExamTypes } from '@/app/apis/examTypeApi';
import type {
  ExamTypeResponse,
  QuestionCollectionRequest,
  QuestionCollectionResponse,
} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import {questionCollectionKeys, examTypeKeys} from '@/app/configs/queryKeys';

export type CollectionItem = {
  collection_id: string;
  name: string;
  description: string;
  question_count: number;
  parent_id: string;
  parent_name: string;
  child_count: number;
  total_question_count: number;
  exam_type_id: string;
  display_order: number | null;
};

const mapCollectionFromApi = (collection: QuestionCollectionResponse): CollectionItem => ({
  collection_id: String(collection.collectionId),
  name: collection.name || '',
  description: collection.description || '',
  question_count: typeof collection.questionCount === 'number' ? collection.questionCount : 0,
  parent_id: collection.parentId ? String(collection.parentId) : '',
  parent_name: collection.parentName || '',
  child_count: typeof collection.childCount === 'number' ? collection.childCount : 0,
  total_question_count:
    typeof collection.totalQuestionCount === 'number'
      ? collection.totalQuestionCount
      : (typeof collection.questionCount === 'number' ? collection.questionCount : 0),
  exam_type_id: collection.examTypeId ? String(collection.examTypeId) : '',
  display_order: typeof collection.displayOrder === 'number' ? collection.displayOrder : null,
});

const normalizeCollections = (data: QuestionCollectionResponse[]): CollectionItem[] =>
  (Array.isArray(data) ? data : []).map(mapCollectionFromApi);
const normalizeExamTypes = (
  data: ExamTypeResponse[] | {data?: ExamTypeResponse[]; content?: ExamTypeResponse[]} | null | undefined,
): ExamTypeResponse[] =>
  Array.isArray(data) ? data : data?.data ?? data?.content ?? [];

export function useAdminQuestionCollections() {
  const collectionsQuery = useQuery({
    queryKey: questionCollectionKeys.all,
    queryFn: getQuestionCollections,
    select: normalizeCollections,
  });

  const examTypesQuery = useQuery({
    queryKey: examTypeKeys.all,
    queryFn: getExamTypes,
    select: normalizeExamTypes,
  });

  const queryClient = useQueryClient();
  const invalidateCollections = () => queryClient.invalidateQueries({ queryKey: questionCollectionKeys.all });

  const createMutation = useMutation({
    mutationFn: (payload: QuestionCollectionRequest) => createQuestionCollection(payload),
    onSuccess: invalidateCollections,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: QuestionCollectionRequest }) =>
      updateQuestionCollection(id, payload),
    onSuccess: invalidateCollections,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuestionCollection(id),
    onSuccess: invalidateCollections,
  });

  return {
    collections: collectionsQuery.data ?? EMPTY_LIST,
    examTypes: examTypesQuery.data ?? EMPTY_LIST,
    isLoading: collectionsQuery.isLoading,
    isSuccess: collectionsQuery.isSuccess,
    isError: collectionsQuery.isError,
    error: collectionsQuery.error,
    refetchCollections: collectionsQuery.refetch,
    createCollection: createMutation.mutateAsync,
    updateCollection: updateMutation.mutateAsync,
    deleteCollection: deleteMutation.mutateAsync,
  };
}
