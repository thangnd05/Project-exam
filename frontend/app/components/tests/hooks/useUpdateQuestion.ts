'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import { updateQuestion } from '@/app/apis/questionApi';
import { questionDetailKeys } from '@/app/hooks/useQuestionDetail';
import type { QuestionAdminResponse, QuestionCreateRequest } from '@/app/types';

export type UpdateQuestionVariables = {
  questionId: string;
  data: QuestionCreateRequest | FormData;
  config?: AxiosRequestConfig;
};

type UseUpdateQuestionOptions = {
  onSuccess?: (
    result: QuestionAdminResponse,
    variables: UpdateQuestionVariables,
    context: unknown,
  ) => void;
  onError?: (error: unknown, variables: UpdateQuestionVariables, context: unknown) => void;
};

export function useUpdateQuestion({ onSuccess, onError }: UseUpdateQuestionOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, data, config }: UpdateQuestionVariables) =>
      updateQuestion(questionId, data, config),
    onSuccess: (result, variables, context) => {
      qc.invalidateQueries({
        queryKey: questionDetailKeys.detail(variables?.questionId),
      });
      onSuccess?.(result, variables, context);
    },
    onError,
  });
}
