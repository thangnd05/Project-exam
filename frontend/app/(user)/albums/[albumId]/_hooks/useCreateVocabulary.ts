'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createVocabulary } from '@/app/apis/vocabularyApi';
import type { VocabularyRequest, VocabularyResponse } from '@/app/types';
import { albumDeltaKeys } from './useAlbumVocabularies';

type UseCreateVocabularyOptions = {
  onSuccess?: (data: VocabularyResponse, ...rest: unknown[]) => void;
  // err để any có chủ đích: lỗi Axios, caller đọc err.response (BE không có type lỗi)
  onError?: (err: any) => void;
};

export function useCreateVocabulary(albumId?: string, { onSuccess, onError }: UseCreateVocabularyOptions = {}) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: VocabularyRequest) => createVocabulary(payload),
        onSuccess: (...args) => {
            qc.invalidateQueries({ queryKey: albumDeltaKeys.vocabularies(albumId) });
            if (onSuccess) onSuccess(...args);
        },
        onError,
    });
}
