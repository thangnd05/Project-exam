import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteQuestion } from '~/shared/api/questionApi';
import { questionDetailKeys } from '~/features/tests/question-bank/modals/hooks/useQuestionDetail';

export function useDeleteQuestion({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId) => deleteQuestion(questionId),
    onSuccess: (data, questionId, context) => {
      qc.invalidateQueries({ queryKey: questionDetailKeys.detail(questionId) });
      onSuccess?.(data, questionId, context);
    },
    onError,
  });
}
