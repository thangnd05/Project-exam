'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyAlbums, deleteAlbum, albumKeys } from '@/app/apis/vocabularyAlbumApi';
import type { VocabularyAlbumResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';


const normalizeAlbums = (data: VocabularyAlbumResponse[]): VocabularyAlbumResponse[] =>
  Array.isArray(data) ? data : ((data as any)?.content ?? []);

export function useMyAlbums() {
  const qc = useQueryClient();

  const albumsQuery = useQuery({
    queryKey: albumKeys.my,
    queryFn: getMyAlbums,
    select: normalizeAlbums,
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: (albumId: string) => deleteAlbum(albumId),
    onSuccess: () => qc.invalidateQueries({ queryKey: albumKeys.my }),
  });

  return {
    albums: albumsQuery.data ?? EMPTY_LIST,
    isLoading: albumsQuery.isLoading,
    refetchAlbums: albumsQuery.refetch,
    deleteAlbumMutation,
  };
}
