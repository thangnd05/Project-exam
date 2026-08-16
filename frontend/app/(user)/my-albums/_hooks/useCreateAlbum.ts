'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAlbum } from '@/app/apis/vocabularyAlbumApi';
import type { VocabularyAlbumRequest, VocabularyAlbumResponse } from '@/app/types';
import { albumKeys } from './useMyAlbums';

type UseCreateAlbumOptions = {
  onSuccess?: (data: VocabularyAlbumResponse, ...rest: unknown[]) => void;
  onError?: (err: any) => void;
};

export function useCreateAlbum({ onSuccess, onError }: UseCreateAlbumOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VocabularyAlbumRequest) => createAlbum(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: albumKeys.my });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}
