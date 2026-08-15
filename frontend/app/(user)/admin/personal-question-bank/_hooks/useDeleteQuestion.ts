'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteQuestion } from '@/app/apis/questionApi';
import { questionDetailKeys } from '@/app/hooks/useQuestionDetail';

type UseDeleteQuestionOptions = {
  onSuccess?: (data: void, questionId: string, context: unknown) => void;
  onError?: (error: unknown, questionId: string, context: unknown) => void;
};

export function useDeleteQuestion({ onSuccess, onError }: UseDeleteQuestionOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => deleteQuestion(questionId),
    onSuccess: (data, questionId, context) => {
      qc.invalidateQueries({ queryKey: questionDetailKeys.detail(questionId) });
      onSuccess?.(data, questionId, context);
    },
    onError,
  });
}
