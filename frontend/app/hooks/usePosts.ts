'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@/app/configs/queryClient';
import { getPosts, getCategories, getPostById, getComments } from '@/app/apis/postApi';
import type { CategoryResponse, PageResponse, PostSummaryResponse } from '@/app/types';

const PAGE_SIZE = 9;

interface PostListFilter {
  page?: number;
  categoryId?: string | null;
  keyword?: string;
  status?: string;
}

export const postsKeys = {
  categories: ['post-categories'],
  list: (params: PostListFilter) => ['posts', params],
  detail: (postId?: string) => ['post', postId],
  comments: (postId?: string) => ['post', postId, 'comments'],
  related: (categoryId?: string) => ['post', 'related', categoryId],
};

const selectPosts = (data: PageResponse<PostSummaryResponse>) => ({
  posts: Array.isArray(data?.content) ? data.content : [],
  totalPages: data?.totalPages ?? 0,
});

const selectCategories = (data: CategoryResponse[]) => (Array.isArray(data) ? data : []);

export function usePosts({ page = 0, categoryId = null, keyword = '', status = 'APPROVED' }: PostListFilter = {}) {
  const qc = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: postsKeys.categories,
    queryFn: getCategories,
    select: selectCategories,
  });

  const listParams = { page, categoryId, keyword, status };
  const postsQuery = useQuery({
    queryKey: postsKeys.list(listParams),
    queryFn: () => getPosts({ page, size: PAGE_SIZE, categoryId: categoryId ?? undefined, keyword, status }),
    select: selectPosts,
    placeholderData: keepPreviousData,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['posts'] });

  return {
    posts: postsQuery.data?.posts ?? [],
    totalPages: postsQuery.data?.totalPages ?? 0,
    categories: categoriesQuery.data ?? [],
    isLoading: postsQuery.isLoading || categoriesQuery.isLoading,
    refresh,
  };
}

export function usePostDetail(postId?: string, { enabled = true }: { enabled?: boolean } = {}) {
  const query = useQuery({
    queryKey: postsKeys.detail(postId),
    queryFn: () => getPostById(postId as string),
    enabled: enabled && !!postId,
  });

  return {
    post: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function usePostComments(postId?: string, { enabled = true }: { enabled?: boolean } = {}) {
  const query = useQuery({
    queryKey: postsKeys.comments(postId),
    queryFn: () => getComments(postId as string),
    enabled: enabled && !!postId,
  });

  return {
    comments: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useRelatedPosts({ categoryId, postId, enabled = true }: { categoryId?: string; postId?: string; enabled?: boolean } = {}) {
  const query = useQuery({
    queryKey: postsKeys.related(categoryId),
    queryFn: () => getPosts({ categoryId, size: 8 }),
    enabled: enabled && !!categoryId,
    select: (data) => (data?.content || []).filter((p) => p.id !== postId),
  });

  return {
    relatedPosts: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function fetchPostById(postId: string) {
  return getPostById(postId);
}
