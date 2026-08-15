'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkCreateVocabularies } from '@/app/apis/vocabularyApi';
import { albumDeltaKeys } from '@/app/features/albums/detail/hooks/useAlbumVocabularies';

export function useBulkCreateVocabularies(albumId, { onSuccess, onError } = {}) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => bulkCreateVocabularies(payload),
        onSuccess: (...args) => {
            qc.invalidateQueries({ queryKey: albumDeltaKeys.vocabularies(albumId) });
            if (onSuccess) onSuccess(...args);
        },
        onError,
    });
}
