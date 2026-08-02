import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAlbum } from '~/shared/api/vocabularyAlbumApi';

export const albumKeys = { myAlbums: ['my-albums'] };

export function useCreateAlbum({ onSuccess, onError } = {}) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => createAlbum(payload),
        onSuccess: (...args) => {
            qc.invalidateQueries({ queryKey: albumKeys.myAlbums });
            if (onSuccess) onSuccess(...args);
        },
        onError,
    });
}
