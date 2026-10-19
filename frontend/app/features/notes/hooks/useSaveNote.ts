'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { createNote, updateNote } from '@/app/apis/noteApi';
import { noteKeys } from '@/app/features/notes/hooks/useNotes';
import type { ApiError, NoteRequest, NoteResponse } from '@/app/types';

type SaveNoteVariables = { noteId: string | null; payload: NoteRequest };

export function useSaveNote({
  onSuccess,
  onError,
}: Pick<UseMutationOptions<NoteResponse, ApiError, SaveNoteVariables>, 'onSuccess' | 'onError'> = {}) {
  const qc = useQueryClient();

  return useMutation<NoteResponse, ApiError, SaveNoteVariables>({
    mutationFn: ({ noteId, payload }) =>
      noteId ? updateNote(noteId, payload) : createNote(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: noteKeys.my });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}
