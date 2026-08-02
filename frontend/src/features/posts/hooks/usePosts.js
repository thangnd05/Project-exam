import { useQuery, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '~/shared/config/queryClient';
import { getPosts, getCategories, getPostById, getComments } from '~/shared/api/postApi';

const PAGE_SIZE = 9;

export const postsKeys = {
  categories: ['post-categories'],
  list: (params) => ['posts', params],
  detail: (postId) => ['post', postId],
  comments: (postId) => ['post', postId, 'comments'],
  related: (categoryId) => ['post', 'related', categoryId],
};

const selectPosts = (data) => ({
  posts: Array.isArray(data?.content) ? data.content : [],
  totalPages: data?.totalPages ?? 0,
});

const selectCategories = (data) => (Array.isArray(data) ? data : []);

export function usePosts({ page = 0, categoryId = null, keyword = '', status = 'APPROVED' } = {}) {
  const qc = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: postsKeys.categories,
    queryFn: getCategories,
    select: selectCategories,
  });

  const listParams = { page, categoryId, keyword, status };
  const postsQuery = useQuery({
    queryKey: postsKeys.list(listParams),
    queryFn: () => getPosts({ page, size: PAGE_SIZE, categoryId, keyword, status }),
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

export function usePostDetail(postId, { enabled = true } = {}) {
  return useQuery({
    queryKey: postsKeys.detail(postId),
    queryFn: () => getPostById(postId),
    enabled: enabled && !!postId,
  });
}

export function usePostComments(postId, { enabled = true } = {}) {
  return useQuery({
    queryKey: postsKeys.comments(postId),
    queryFn: () => getComments(postId),
    enabled: enabled && !!postId,
  });
}

export function useRelatedPosts({ categoryId, postId, enabled = true } = {}) {
  return useQuery({
    queryKey: postsKeys.related(categoryId),
    queryFn: () => getPosts({ categoryId, size: 8 }),
    enabled: enabled && !!categoryId,
    select: (data) => (data?.content || []).filter((p) => p.id !== postId),
  });
}

export function fetchPostById(postId) {
  return getPostById(postId);
}
