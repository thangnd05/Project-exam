'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { updateVocabulary } from '@/app/apis/vocabularyApi';
import type { VocabularyRequest, VocabularyResponse } from '@/app/types';

type UpdateVocabularyVariables = { vocabId: string; data: VocabularyRequest };

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
