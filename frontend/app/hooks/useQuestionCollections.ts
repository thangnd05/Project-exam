'use client';

import { useQuery } from '@tanstack/react-query';
import { getQuestionCollections } from '@/app/apis/questionCollectionApi';
import type { QuestionCollectionResponse } from '@/app/types';

export const questionCollectionKeys = {
  list: ['question-collections'],
};

// API đã trả mảng, vẫn giữ fallback data/content của bản JS cho response cũ -> `any` có chủ đích.
const normalizeCollections = (data: any): QuestionCollectionResponse[] =>
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
