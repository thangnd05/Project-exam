'use client';

import { useMutation } from '@tanstack/react-query';
import { updateVocabulary } from '@/app/apis/vocabularyApi';

export function useUpdateVocabulary(options = {}) {
    return useMutation({
        mutationFn: ({ vocabId, data }) => updateVocabulary(vocabId, data),
        ...options,
    });
}
