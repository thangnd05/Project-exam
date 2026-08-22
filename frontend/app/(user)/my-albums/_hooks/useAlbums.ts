'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  albumKeys,
  createAlbum,
  deleteAlbum,
  getMyAlbums,
  updateAlbum,
} from '@/app/apis/vocabularyAlbumApi';
import type { VocabularyAlbumRequest, VocabularyAlbumResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

type MutationCallbacks<T> = {
  onSuccess?: (data: T, ...rest: unknown[]) => void;
  onError?: (err: any) => void;
};

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

export function useCreateAlbum({
  onSuccess,
  onError,
}: MutationCallbacks<VocabularyAlbumResponse> = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VocabularyAlbumRequest) => createAlbum(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: albumKeys.my });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}

type UpdateAlbumVariables = { albumId: string; payload: VocabularyAlbumRequest };

export function useUpdateAlbum({
  onSuccess,
  onError,
}: MutationCallbacks<VocabularyAlbumResponse> = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, payload }: UpdateAlbumVariables) => updateAlbum(albumId, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: albumKeys.my });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}
