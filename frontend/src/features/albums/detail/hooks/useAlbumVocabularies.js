import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVocabulariesByAlbum, deleteVocabulary } from '~/shared/api/vocabularyApi';

export const albumDeltaKeys = {
  vocabularies: (albumId) => ['album-vocabularies', albumId],
};

const normalizeVocabularies = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];

export function useAlbumVocabularies(albumId) {
  const query = useQuery({
    queryKey: albumDeltaKeys.vocabularies(albumId),
    queryFn: () => getVocabulariesByAlbum(albumId),
    enabled: !!albumId,
    select: normalizeVocabularies,
  });

  return {
    vocabularies: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useDeleteVocabulary(albumId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vocabId) => deleteVocabulary(vocabId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: albumDeltaKeys.vocabularies(albumId) }),
  });
}
