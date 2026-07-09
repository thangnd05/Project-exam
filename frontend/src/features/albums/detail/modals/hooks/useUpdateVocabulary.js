import { useMutation } from '@tanstack/react-query';
import { updateVocabulary } from '~/features/albums/detail/api/vocabularyApi';

export function useUpdateVocabulary(options = {}) {
    return useMutation({
        mutationFn: ({ vocabId, data }) => updateVocabulary(vocabId, data),
        ...options,
    });
}
