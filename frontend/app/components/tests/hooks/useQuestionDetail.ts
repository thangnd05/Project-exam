'use client';

import { useQuery } from '@tanstack/react-query';
import { getQuestionById } from '@/app/apis/questionApi';

export const questionDetailKeys = {
  detail: (id?: string) => ['question-detail', id],
};

export function useQuestionDetail(questionId?: string, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: questionDetailKeys.detail(questionId),
    queryFn: () => getQuestionById(questionId as string),
    enabled: enabled && !!questionId,
  });

  return {
    question: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
