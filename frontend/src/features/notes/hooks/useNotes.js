import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyNotes, deleteNote } from '~/features/notes/api/noteApi';

export const noteKeys = { my: ['my-notes'] };

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
