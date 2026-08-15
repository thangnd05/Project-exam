'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAlbum } from '@/app/apis/vocabularyAlbumApi';
import { albumKeys } from '@/app/features/albums/list/hooks/useMyAlbums';

export function useCreateAlbum({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createAlbum(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: albumKeys.my });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}
