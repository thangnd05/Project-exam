import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSavedPosts, toggleSavePost } from '~/api/postApi';
import { keepPreviousData } from '~/config/queryClient';

export const savedPostsKeys = {
  all: ['saved-posts'],
  list: ({ page, size, keyword }) => ['saved-posts', { page, size, keyword }],
};

const normalize = (data) => ({
  posts: Array.isArray(data?.content) ? data.content : [],
  totalPages: data?.totalPages || 0,
});

export function useSavedPosts({ page = 0, size = 10, keyword = '' } = {}) {
  return useQuery({
    queryKey: savedPostsKeys.list({ page, size, keyword }),
    queryFn: () => getSavedPosts({ page, size, keyword }),
    placeholderData: keepPreviousData,
    select: normalize,
  });
}

export function useUnsavePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId) => toggleSavePost(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: savedPostsKeys.all }),
  });
}
