'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { updateVocabulary } from '@/app/apis/vocabularyApi';
import type { VocabularyRequest, VocabularyResponse } from '@/app/types';

type UpdateVocabularyVariables = { vocabId: string; data: VocabularyRequest };

// TError = any có chủ đích: lỗi Axios, caller đọc err.response (BE không có type lỗi)
type UseUpdateVocabularyOptions = Omit<
  UseMutationOptions<VocabularyResponse, any, UpdateVocabularyVariables>,
  'mutationFn'
>;

export function useUpdateVocabulary(options: UseUpdateVocabularyOptions = {}) {
    return useMutation({
        mutationFn: ({ vocabId, data }: UpdateVocabularyVariables) => updateVocabulary(vocabId, data),
        ...options,
    });
}
