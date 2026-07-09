import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyAlbums, deleteAlbum } from '~/features/album-voca/api/vocabularyAlbumApi';

export const albumKeys = { my: ['my-albums'] };

const normalizeAlbums = (data) => (Array.isArray(data) ? data : data?.content ?? []);

export function useMyAlbums() {
  const qc = useQueryClient();

  const albumsQuery = useQuery({
    queryKey: albumKeys.my,
    queryFn: getMyAlbums,
    select: normalizeAlbums,
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: (albumId) => deleteAlbum(albumId),
    onSuccess: () => qc.invalidateQueries({ queryKey: albumKeys.my }),
  });

  return {
    albums: albumsQuery.data ?? [],
    isLoading: albumsQuery.isLoading,
    refetchAlbums: albumsQuery.refetch,
    deleteAlbumMutation,
  };
}
