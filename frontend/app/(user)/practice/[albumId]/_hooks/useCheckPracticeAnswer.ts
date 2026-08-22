'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkPracticeAnswer } from '@/app/apis/practiceQuestionApi';
import type { PracticeCheckRequest, PracticeCheckResponse } from '@/app/types';
import { albumKeys } from '@/app/apis/vocabularyAlbumApi';
import { albumDeltaKeys } from '@/app/apis/vocabularyApi';

type UseCheckPracticeAnswerOptions = {
  onSuccess?: (data: PracticeCheckResponse, ...rest: unknown[]) => void;
  onError?: (err: any) => void;
};

export function useCheckPracticeAnswer(albumId?: string, { onSuccess, onError }: UseCheckPracticeAnswerOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PracticeCheckRequest) => checkPracticeAnswer(payload),
    onSuccess: (...args) => {

      qc.invalidateQueries({ queryKey: albumKeys.my });
      qc.invalidateQueries({ queryKey: albumDeltaKeys.vocabularies(albumId) });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}
