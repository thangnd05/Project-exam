import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAlbum } from '~/shared/api/vocabularyAlbumApi';
import { albumKeys } from '~/features/albums/list/hooks/useMyAlbums';

export function useUpdateAlbum({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, payload }) => updateAlbum(albumId, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: albumKeys.my });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}
