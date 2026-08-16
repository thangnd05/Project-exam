'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVocabulariesByAlbum, deleteVocabulary } from '@/app/apis/vocabularyApi';
import type { VocabularyResponse } from '@/app/types';

export const albumDeltaKeys = {
  vocabularies: (albumId?: string) => ['album-vocabularies', albumId],
};

const normalizeVocabularies = (data: VocabularyResponse[]): VocabularyResponse[] =>
  Array.isArray(data) ? data : Array.isArray((data as any)?.content) ? (data as any).content : [];

export function useAlbumVocabularies(albumId?: string) {
  const query = useQuery({
    queryKey: albumDeltaKeys.vocabularies(albumId),
    queryFn: () => getVocabulariesByAlbum(albumId!),
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

export function useDeleteVocabulary(albumId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vocabId: string) => deleteVocabulary(vocabId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: albumDeltaKeys.vocabularies(albumId) }),
  });
}
