import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '~/shared/config/queryClient';
import { getMyPosts, getCategories, deletePost } from '~/api/postApi';

export const myPostsKeys = {
  all: ['my-posts'],
  list: (params) => ['my-posts', 'list', params],
  categories: ['post-categories'],
};

const normalizePage = (data) => ({
  posts: Array.isArray(data?.content) ? data.content : [],
  totalPages: data?.totalPages || 0,
});

const normalizeCategories = (data) => (Array.isArray(data) ? data : []);

export function useMyPosts({ page, size, keyword, status }) {
  const qc = useQueryClient();

  const apiParams = {
    page,
    size,
    keyword,
    status: status !== 'ALL' ? status : undefined,
  };

  const listQuery = useQuery({
    queryKey: myPostsKeys.list(apiParams),
    queryFn: () => getMyPosts(apiParams),
    placeholderData: keepPreviousData,
    select: normalizePage,
  });

  const categoriesQuery = useQuery({
    queryKey: myPostsKeys.categories,
    queryFn: getCategories,
    select: normalizeCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => qc.invalidateQueries({ queryKey: myPostsKeys.all }),
  });

  return {
    posts: listQuery.data?.posts ?? [],
    totalPages: listQuery.data?.totalPages ?? 0,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    categories: categoriesQuery.data ?? [],
    deleteMutation,
  };
}
