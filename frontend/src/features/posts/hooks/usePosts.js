import { useQuery, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '~/shared/config/queryClient';
import { getPosts, getCategories } from '~/shared/api/postApi';

const PAGE_SIZE = 9;

export const postsKeys = {
  categories: ['post-categories'],
  list: (params) => ['posts', params],
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
