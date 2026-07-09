import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createQuestionCollection,
  deleteQuestionCollection,
  getQuestionCollections,
  updateQuestionCollection,
} from '~/shared/api/questionCollectionApi';
import { getExamTypes } from '~/shared/api/examTypeApi';

export const questionCollectionKeys = {
  all: ['admin-question-collections'],
  examTypes: ['admin-question-collections', 'exam-types'],
};

const mapCollectionFromApi = (collection) => ({
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

const normalizeCollections = (data) => (Array.isArray(data) ? data : []).map(mapCollectionFromApi);
const normalizeExamTypes = (data) =>
  Array.isArray(data) ? data : data?.data ?? data?.content ?? [];

export function useQuestionCollections() {
  const collectionsQuery = useQuery({
    queryKey: questionCollectionKeys.all,
    queryFn: getQuestionCollections,
    select: normalizeCollections,
  });

  const examTypesQuery = useQuery({
    queryKey: questionCollectionKeys.examTypes,
    queryFn: getExamTypes,
    select: normalizeExamTypes,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createQuestionCollection(payload),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateQuestionCollection(id, payload),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteQuestionCollection(id),
  });

  return {
    collections: collectionsQuery.data ?? [],
    examTypes: examTypesQuery.data ?? [],
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
