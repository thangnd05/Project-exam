'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAlbum } from '@/app/apis/vocabularyAlbumApi';
import type { VocabularyAlbumRequest, VocabularyAlbumResponse } from '@/app/types';
import { albumKeys } from './useMyAlbums';

type UpdateAlbumVariables = { albumId: string; payload: VocabularyAlbumRequest };

type UseUpdateAlbumOptions = {
  onSuccess?: (data: VocabularyAlbumResponse, ...rest: unknown[]) => void;
  // err để any có chủ đích: lỗi Axios, caller đọc err.response.data.message (BE không có type lỗi)
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
