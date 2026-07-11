import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleReact, toggleSavePost } from '~/shared/api/postApi';
import { savedPostsKeys } from '~/features/user/profile/sections/useSavedPosts';

// PostDetailPage hiển thị trạng thái react bằng state thủ công + optimistic update,
// và không có query react-query nào phụ thuộc, nên hook chỉ gọi API và trả kết quả
// về component qua onSuccess (component tự set lại từ summary trả về).
export function useToggleReact({ onSuccess, onError } = {}) {
  return useMutation({
    mutationFn: ({ postId, type }) => toggleReact(postId, { type }),
    onSuccess: (...args) => {
      onSuccess?.(...args);
    },
    onError,
  });
}

// Toggle lưu/bỏ lưu bài viết. Invalidate danh sách bài đã lưu ở trang hồ sơ
// (savedPostsKeys.all) để UI đó tự refresh khi user lưu/bỏ lưu từ trang chi tiết.
export function useToggleSavePost({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId) => toggleSavePost(postId),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: savedPostsKeys.all });
      onSuccess?.(...args);
    },
    onError,
  });
}
