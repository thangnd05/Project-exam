'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addComment, updateComment, deleteComment } from '~/shared/api/postApi';

export function useAddComment({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, data }) => addComment(postId, data),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useUpdateComment({ onSuccess, onError } = {}) {
  return useMutation({
    mutationFn: ({ commentId, data }) => updateComment(commentId, data),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useDeleteComment({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId) => deleteComment(commentId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      onSuccess?.(...args);
    },
    onError,
  });
}
