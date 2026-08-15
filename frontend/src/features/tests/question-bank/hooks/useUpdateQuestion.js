'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateQuestion } from '~/shared/api/questionApi';
import { questionDetailKeys } from '~/features/tests/question-bank/hooks/useQuestionDetail';

export function useUpdateQuestion({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, data, config }) =>
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
