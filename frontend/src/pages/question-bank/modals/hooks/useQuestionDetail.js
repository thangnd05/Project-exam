import { useQuery } from '@tanstack/react-query';
import { getQuestionById } from '~/api/questionApi';

export const questionDetailKeys = {
  detail: (id) => ['question-detail', id],
};

export function useQuestionDetail(questionId, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: questionDetailKeys.detail(questionId),
    queryFn: () => getQuestionById(questionId),
    enabled: enabled && !!questionId,
  });

  return {
    question: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
