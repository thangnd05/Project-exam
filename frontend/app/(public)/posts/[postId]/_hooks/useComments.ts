'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addComment, updateComment, deleteComment } from '@/app/apis/postApi';
import type { CommentRequest, CommentResponse } from '@/app/types';

interface AddCommentVariables {
  postId: string;
  data: CommentRequest;
}

interface UpdateCommentVariables {
  commentId: string;
  data: CommentRequest;
}

/* Callback tuỳ chọn truyền lúc khởi tạo hook; các tham số sau (data/error, variables)
   để rest any[] có chủ đích cho khớp chữ ký callback của react-query v5 */
interface MutationCallbacks<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables, ...rest: any[]) => void;
  onError?: (error: Error, variables: TVariables, ...rest: any[]) => void;
}

export function useAddComment({ onSuccess, onError }: MutationCallbacks<CommentResponse, AddCommentVariables> = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, data }: AddCommentVariables) => addComment(postId, data),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useUpdateComment({ onSuccess, onError }: MutationCallbacks<CommentResponse, UpdateCommentVariables> = {}) {
  return useMutation({
    mutationFn: ({ commentId, data }: UpdateCommentVariables) => updateComment(commentId, data),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useDeleteComment({ onSuccess, onError }: MutationCallbacks<void, string> = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      onSuccess?.(...args);
    },
    onError,
  });
}
