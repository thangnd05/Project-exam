'use client';

import { useQuery } from '@tanstack/react-query';
import { getQuestionCollections } from '@/app/apis/questionCollectionApi';
import type { QuestionCollectionResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import {questionCollectionKeys} from '@/app/configs/queryKeys';

// Response có thể bọc trong { data } hoặc { content }; chuẩn hoá về mảng.
const normalizeCollections = (data: unknown): QuestionCollectionResponse[] => {
  if (Array.isArray(data)) return data;
  const wrapped = data as { data?: QuestionCollectionResponse[]; content?: QuestionCollectionResponse[] } | null;
  return wrapped?.data || wrapped?.content || [];
};

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
