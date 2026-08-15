'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNote, updateNote } from '@/app/apis/noteApi';
import { noteKeys } from '@/app/components/Notes/useNotes';
import type { NoteRequest, NoteResponse } from '@/app/types';

type SaveNoteVariables = { noteId: string | null; payload: NoteRequest };

// Callback pass-through nhận ...args: any[] để khớp chữ ký onSuccess/onError của
// react-query v5 (đủ tham số); TError = any vì consumer đọc err.response?.data?.message.
export function useSaveNote({
  onSuccess,
  onError,
}: {
  onSuccess?: (...args: any[]) => void;
  onError?: (...args: any[]) => void;
} = {}) {
  const qc = useQueryClient();

  return useMutation<NoteResponse, any, SaveNoteVariables>({
    mutationFn: ({ noteId, payload }) =>
      noteId ? updateNote(noteId, payload) : createNote(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: noteKeys.my });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}
