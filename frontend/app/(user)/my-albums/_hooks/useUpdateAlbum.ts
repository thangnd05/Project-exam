'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAlbum } from '@/app/apis/vocabularyAlbumApi';
import type { VocabularyAlbumRequest, VocabularyAlbumResponse } from '@/app/types';
import { albumKeys } from './useMyAlbums';

type UpdateAlbumVariables = { albumId: string; payload: VocabularyAlbumRequest };

type UseUpdateAlbumOptions = {
  onSuccess?: (data: VocabularyAlbumResponse, ...rest: unknown[]) => void;
  onError?: (err: any) => void;
};

export function useUpdateAlbum({ onSuccess, onError }: UseUpdateAlbumOptions = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, payload }: UpdateAlbumVariables) => updateAlbum(albumId, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: albumKeys.my });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}
