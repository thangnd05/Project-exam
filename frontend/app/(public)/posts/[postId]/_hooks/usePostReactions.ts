'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleReact, toggleSavePost } from '@/app/apis/postApi';
import { savedPostsKeys } from '@/app/features/user/profile/hooks/useSavedPosts';
import type { ReactSummaryResponse, SavedPostStatusResponse } from '@/app/types';
import { ReactType } from '@/app/enums';

interface ToggleReactVariables {
  postId: string;
  type: ReactType;
}

/* Callback tuỳ chọn truyền lúc khởi tạo hook; các tham số sau (data/error, variables)
   để rest any[] có chủ đích cho khớp chữ ký callback của react-query v5 */
interface MutationCallbacks<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables, ...rest: any[]) => void;
  onError?: (error: Error, variables: TVariables, ...rest: any[]) => void;
}

export function useToggleReact({ onSuccess, onError }: MutationCallbacks<ReactSummaryResponse, ToggleReactVariables> = {}) {
  return useMutation({
    mutationFn: ({ postId, type }: ToggleReactVariables) => toggleReact(postId, { type }),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useToggleSavePost({ onSuccess, onError }: MutationCallbacks<SavedPostStatusResponse, string> = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => toggleSavePost(postId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: savedPostsKeys.all });
      onSuccess?.(...args);
    },
    onError,
  });
}
