import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyNotes, deleteNote } from '~/features/notes/api/noteApi';

export const noteKeys = { my: ['my-notes'] };

/**
 * @param enabled panel nằm sẵn trong header nên hook chạy ở mọi trang; chỉ gọi
 *   API khi panel thật sự mở để không tốn thêm một request mỗi lần tải trang.
 */
export function useNotes({ enabled = true } = {}) {
  const qc = useQueryClient();

  const notesQuery = useQuery({
    queryKey: noteKeys.my,
    queryFn: getMyNotes,
    enabled,
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId) => deleteNote(noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: noteKeys.my }),
  });

  return {
    notes: notesQuery.data ?? [],
    isLoading: notesQuery.isLoading,
    refetchNotes: notesQuery.refetch,
    deleteNoteMutation,
  };
}
