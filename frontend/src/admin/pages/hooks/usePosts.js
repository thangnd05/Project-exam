import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '~/config/queryClient';
import { getPosts, updatePostStatus, deletePost } from '~/api/postApi';

export const postKeys = {
    all: ['admin-posts'],
    list: (params) => ['admin-posts', params],
};

export function usePosts({ page, size, status, keyword }) {
    return useQuery({
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
