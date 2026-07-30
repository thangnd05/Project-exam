import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNote, updateNote } from '~/features/notes/api/noteApi';
import { noteKeys } from './useNotes';

/**
 * Tạo mới hoặc sửa ghi chú qua cùng một mutation — panel dùng chung một form cho
 * cả hai chế độ nên tách ra hai hook chỉ làm phình chỗ gọi.
 */
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
