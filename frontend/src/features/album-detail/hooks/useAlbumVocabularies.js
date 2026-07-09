import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVocabulariesByAlbum, deleteVocabulary } from '~/features/album-detail/api/vocabularyApi';

export const albumDeltaKeys = {
  vocabularies: (albumId) => ['album-vocabularies', albumId],
};

const normalizeVocabularies = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];

export function useAlbumVocabularies(albumId) {
  return useQuery({
    queryKey: albumDeltaKeys.vocabularies(albumId),
    queryFn: () => getVocabulariesByAlbum(albumId),
    enabled: !!albumId,
    select: normalizeVocabularies,
  });
}

export function useDeleteVocabulary(albumId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vocabId) => deleteVocabulary(vocabId),
    onSuccess: () => qc.invalidateQueries({ queryKey: albumDeltaKeys.vocabularies(albumId) }),
  });
}
