import NotFound from '@/app/components/NotFound/NotFound';

export const metadata = {
  title: 'Không tìm thấy trang',
  // Bắt buộc phải có: `notFound()` gọi từ trang chi tiết hiển thị đúng giao diện này nhưng
  // KHÔNG đổi được HTTP status về 404 — DefaultLayout là client component bọc children nên
  // Next đã flush shell với 200 trước đó. noindex là thứ giữ trang đã xoá khỏi chỉ mục.
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return <NotFound />;
}
