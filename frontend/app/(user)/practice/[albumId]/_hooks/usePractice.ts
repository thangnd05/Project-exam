'use client';

import { useMutation, useQueryClient, type QueryClient, type UseMutationOptions } from '@tanstack/react-query';
import {
  checkPracticeAnswer,
  generatePracticeQuestion,
  markVocabKnown,
} from '@/app/apis/practiceQuestionApi';
import { albumKeys } from '@/app/apis/vocabularyAlbumApi';
import { albumDeltaKeys } from '@/app/apis/vocabularyApi';
import type {
  MessageResponse,
  PracticeCheckRequest,
  PracticeCheckResponse,
  PracticeQuestionResponse,
} from '@/app/types';

type MutationCallbacks<T> = {
  onSuccess?: (data: T, ...rest: unknown[]) => void;
  onError?: (err: any) => void;
};

/**
 * Luyện tập làm đổi tiến độ từ vựng, nên vừa phải làm mới danh sách album (số từ đã thuộc
 * hiện ở màn my-albums) vừa làm mới danh sách từ trong album đang luyện.
 */
const invalidateAlbumProgress = (qc: QueryClient, albumId?: string) => {
  qc.invalidateQueries({ queryKey: albumKeys.my });
  qc.invalidateQueries({ queryKey: albumDeltaKeys.vocabularies(albumId) });
};

export function useGeneratePracticeQuestion(
  albumId?: string,
  options: Omit<
    UseMutationOptions<PracticeQuestionResponse | null, any, void>,
    'mutationFn'
  > = {}
) {
  return useMutation({
    mutationFn: () => generatePracticeQuestion(albumId!),
    ...options,
  });
}

export function useCheckPracticeAnswer(
  albumId?: string,
  { onSuccess, onError }: MutationCallbacks<PracticeCheckResponse> = {}
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PracticeCheckRequest) => checkPracticeAnswer(payload),
    onSuccess: (...args) => {
      invalidateAlbumProgress(qc, albumId);
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}

export function useMarkVocabKnown(
  albumId?: string,
  { onSuccess, onError }: MutationCallbacks<MessageResponse> = {}
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vocabId: string) => markVocabKnown(vocabId),
    onSuccess: (...args) => {
      invalidateAlbumProgress(qc, albumId);
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}
