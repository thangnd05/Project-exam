'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markVocabKnown } from '@/app/apis/practiceQuestionApi';
import type { MessageResponse } from '@/app/types';
import { albumKeys } from '@/app/(user)/my-albums/_hooks/useMyAlbums';
import { albumDeltaKeys } from '@/app/(user)/albums/[albumId]/_hooks/useAlbumVocabularies';

type UseMarkVocabKnownOptions = {
  onSuccess?: (data: MessageResponse, ...rest: unknown[]) => void;
  // err để any có chủ đích: lỗi Axios, caller đọc err.response (BE không có type lỗi)
  onError?: (err: any) => void;
};

export function useMarkVocabKnown(albumId?: string, { onSuccess, onError }: UseMarkVocabKnownOptions = {}) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (vocabId: string) => markVocabKnown(vocabId),
        onSuccess: (...args) => {
            qc.invalidateQueries({ queryKey: albumKeys.my });
            qc.invalidateQueries({ queryKey: albumDeltaKeys.vocabularies(albumId) });
            if (onSuccess) onSuccess(...args);
        },
        onError,
    });
}
