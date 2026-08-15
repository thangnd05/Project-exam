'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkCreateVocabularies } from '@/app/apis/vocabularyApi';
import type { VocabularyRequest, VocabularyResponse } from '@/app/types';
import { albumDeltaKeys } from './useAlbumVocabularies';

type UseBulkCreateVocabulariesOptions = {
  onSuccess?: (data: VocabularyResponse[], ...rest: unknown[]) => void;
  // err để any có chủ đích: lỗi Axios, caller đọc err.response.data.message (BE không có type lỗi)
  onError?: (err: any) => void;
};

export function useBulkCreateVocabularies(albumId?: string, { onSuccess, onError }: UseBulkCreateVocabulariesOptions = {}) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: VocabularyRequest[]) => bulkCreateVocabularies(payload),
        onSuccess: (...args) => {
            qc.invalidateQueries({ queryKey: albumDeltaKeys.vocabularies(albumId) });
            if (onSuccess) onSuccess(...args);
        },
        onError,
    });
}
