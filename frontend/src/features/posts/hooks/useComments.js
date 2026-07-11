import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addComment, updateComment, deleteComment } from '~/shared/api/postApi';

// PostDetailPage tự fetch danh sách comment bằng state thủ công (không qua react-query),
// nên các mutation dưới đây để component tự refetch qua onSuccess. Chỉ invalidate key list
// bài viết đang tồn tại (['posts']) vì card danh sách hiển thị commentCount.
export function useAddComment({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, data }) => addComment(postId, data),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useUpdateComment({ onSuccess, onError } = {}) {
  return useMutation({
    mutationFn: ({ commentId, data }) => updateComment(commentId, data),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useDeleteComment({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId) => deleteComment(commentId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      onSuccess?.(...args);
    },
    onError,
  });
}
