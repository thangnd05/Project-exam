import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAlbum } from '~/features/album/list/api/vocabularyAlbumApi';

export const albumKeys = { myAlbums: ['my-albums'] };

export function useUpdateAlbum({ onSuccess, onError } = {}) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ albumId, payload }) => updateAlbum(albumId, payload),
        onSuccess: (...args) => {
            qc.invalidateQueries({ queryKey: albumKeys.myAlbums });
            if (onSuccess) onSuccess(...args);
        },
        onError,
    });
}
