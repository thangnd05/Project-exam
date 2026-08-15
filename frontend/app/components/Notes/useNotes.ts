'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyNotes, deleteNote } from '@/app/apis/noteApi';

export const noteKeys = { my: ['my-notes'] };

export function useNotes({ enabled = true }: { enabled?: boolean } = {}) {
  const qc = useQueryClient();

  const notesQuery = useQuery({
    queryKey: noteKeys.my,
    queryFn: getMyNotes,
    enabled,
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: noteKeys.my }),
  });

  return {
    notes: notesQuery.data ?? [],
    isLoading: notesQuery.isLoading,
    refetchNotes: notesQuery.refetch,
    deleteNoteMutation,
  };
}
