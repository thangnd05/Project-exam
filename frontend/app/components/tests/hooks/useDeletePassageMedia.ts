'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePassageMedia } from '@/app/apis/passageMediaApi';
import { questionDetailKeys } from '@/app/hooks/useQuestionDetail';

export type DeletePassageMediaVariables = {
  mediaId: string;
  questionId?: string;
};

type UseDeletePassageMediaOptions = {
  onSuccess?: (data: void, variables: DeletePassageMediaVariables, context: unknown) => void;
  onError?: (error: unknown, variables: DeletePassageMediaVariables, context: unknown) => void;
};

export function useDeletePassageMedia({
  onSuccess,
  onError,
}: UseDeletePassageMediaOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mediaId }: DeletePassageMediaVariables) => deletePassageMedia(mediaId),
    onSuccess: (data, variables, context) => {
      qc.invalidateQueries({
        queryKey: questionDetailKeys.detail(variables?.questionId),
      });
      onSuccess?.(data, variables, context);
    },
    onError,
  });
}
