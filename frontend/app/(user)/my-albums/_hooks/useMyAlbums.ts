'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyAlbums, deleteAlbum } from '@/app/apis/vocabularyAlbumApi';
import type { VocabularyAlbumResponse } from '@/app/types';

export const albumKeys = { my: ['my-albums'] };

// API trả mảng, nhưng giữ nhánh phòng hờ dạng phân trang { content } như bản JS cũ
// (data as any vì nhánh { content } không nằm trong kiểu trả về đã khai báo của API)
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
    albums: albumsQuery.data ?? [],
    isLoading: albumsQuery.isLoading,
    refetchAlbums: albumsQuery.refetch,
    deleteAlbumMutation,
  };
}
