import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePassageMedia } from '~/shared/api/passageMediaApi';
import { questionDetailKeys } from './useQuestionDetail';

export function useDeletePassageMedia({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mediaId }) => deletePassageMedia(mediaId),
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({
        queryKey: questionDetailKeys.detail(variables?.questionId),
      });
      onSuccess?.(data, variables, context);
    },
    onError,
  });
}
