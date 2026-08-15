'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleReact, toggleSavePost } from '~/shared/api/postApi';
import { savedPostsKeys } from '~/features/user/profile/hooks/useSavedPosts';

export function useToggleReact({ onSuccess, onError } = {}) {
  return useMutation({
    mutationFn: ({ postId, type }) => toggleReact(postId, { type }),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useToggleSavePost({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId) => toggleSavePost(postId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: savedPostsKeys.all });
      onSuccess?.(...args);
    },
    onError,
  });
}
