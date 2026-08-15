'use client';

import { useQuery } from '@tanstack/react-query';
import { getQuestionCollections } from '@/app/apis/questionCollectionApi';

export const questionCollectionKeys = {
  list: ['question-collections'],
};

const normalizeCollections = (data) =>
  Array.isArray(data) ? data : data?.data || data?.content || [];

export function useQuestionCollections() {
  const query = useQuery({
    queryKey: questionCollectionKeys.list,
    queryFn: getQuestionCollections,
    select: normalizeCollections,
  });

  return {
    questionCollections: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
