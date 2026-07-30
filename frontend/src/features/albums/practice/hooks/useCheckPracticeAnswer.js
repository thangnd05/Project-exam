import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkPracticeAnswer } from '~/features/albums/practice/api/practiceQuestionApi';
import { albumKeys } from '~/features/albums/list/hooks/useMyAlbums';
import { albumDeltaKeys } from '~/features/albums/detail/hooks/useAlbumVocabularies';

export function useCheckPracticeAnswer(albumId, { onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => checkPracticeAnswer(payload),
    onSuccess: (...args) => {

      qc.invalidateQueries({ queryKey: albumKeys.my });
      qc.invalidateQueries({ queryKey: albumDeltaKeys.vocabularies(albumId) });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}
