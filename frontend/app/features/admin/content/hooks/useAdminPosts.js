'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@/app/configs/queryClient';
import { getPosts, updatePostStatus, deletePost } from '@/app/apis/postApi';

export const postKeys = {
  all: ['admin-posts'],
  list: (params) => ['admin-posts', params],
};

export function useAdminPosts({ page, size, status, keyword }) {
  const query = useQuery({
    queryKey: postKeys.list({ page, size, status, keyword }),
    queryFn: () =>
      getPosts({
        page,
        size,
        status: status === 'ALL' ? undefined : status,
        keyword,
      }),
    placeholderData: keepPreviousData,
  });

  return {
    posts: query.data?.content || [],
    totalPages: query.data?.totalPages || 0,
    totalElements: query.data?.totalElements || 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useApprovePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => updatePostStatus(id, 'APPROVED'),
    onSuccess: () => qc.invalidateQueries({ queryKey: postKeys.all }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deletePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: postKeys.all }),
  });
}
