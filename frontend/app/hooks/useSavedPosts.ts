'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSavedPosts, toggleSavePost } from '@/app/apis/postApi';
import { keepPreviousData } from '@/app/configs/queryClient';
import type { PageResponse, PostSummaryResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

interface SavedPostsParams {
  page?: number;
  size?: number;
  keyword?: string;
}

export const savedPostsKeys = {
  all: ['saved-posts'],
  list: ({ page, size, keyword }: SavedPostsParams) => ['saved-posts', { page, size, keyword }],
};

const normalize = (data: PageResponse<PostSummaryResponse>) => ({
  posts: Array.isArray(data?.content) ? data.content : [],
  totalPages: data?.totalPages || 0,
});

export function useSavedPosts({ page = 0, size = 10, keyword = '' }: SavedPostsParams = {}) {
  const query = useQuery({
    queryKey: savedPostsKeys.list({ page, size, keyword }),
    queryFn: () => getSavedPosts({ page, size, keyword }),
    placeholderData: keepPreviousData,
    select: normalize,
  });

  return {
    posts: query.data?.posts ?? EMPTY_LIST,
    totalPages: query.data?.totalPages ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useUnsavePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => toggleSavePost(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: savedPostsKeys.all }),
  });
}
