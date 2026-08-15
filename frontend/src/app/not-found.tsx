// 404 chuẩn của Next: bắt mọi URL không khớp route nào. Thay cho route '*' của react-router.
// Trang /not-found (điều hướng thủ công khi thiếu quyền) vẫn tồn tại riêng ở (bare)/not-found.
import NotFoundPage from '~/features/error/NotFoundPage';

export const metadata = {
  title: 'Không tìm thấy trang',
};

export default function NotFound() {
  return <NotFoundPage />;
}
