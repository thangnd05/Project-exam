'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markVocabKnown } from '~/shared/api/practiceQuestionApi';
import { albumKeys } from '~/features/albums/list/hooks/useMyAlbums';
import { albumDeltaKeys } from '~/features/albums/detail/hooks/useAlbumVocabularies';

export function useMarkVocabKnown(albumId, { onSuccess, onError } = {}) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (vocabId) => markVocabKnown(vocabId),
        onSuccess: (...args) => {
            qc.invalidateQueries({ queryKey: albumKeys.my });
            qc.invalidateQueries({ queryKey: albumDeltaKeys.vocabularies(albumId) });
            if (onSuccess) onSuccess(...args);
        },
        onError,
    });
}
