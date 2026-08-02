import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNote, updateNote } from '~/shared/api/noteApi';
import { noteKeys } from '~/features/notes/hooks/useNotes';

export function useSaveNote({ onSuccess, onError } = {}) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, payload }) =>
      noteId ? updateNote(noteId, payload) : createNote(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: noteKeys.my });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}
