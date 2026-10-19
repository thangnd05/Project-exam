'use client';

import { useQuery } from '@tanstack/react-query';
import { getQuestionCollections } from '@/app/apis/questionCollectionApi';
import type { QuestionCollectionResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import {questionCollectionKeys} from '@/app/configs/queryKeys';

const normalizeCollections = (data: any): QuestionCollectionResponse[] =>
  Array.isArray(data) ? data : data?.data || data?.content || [];

export function useQuestionCollections() {
  const query = useQuery({
    queryKey: questionCollectionKeys.all,
    queryFn: getQuestionCollections,
    select: normalizeCollections,
  });

  return {
    questionCollections: query.data ?? EMPTY_LIST,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
