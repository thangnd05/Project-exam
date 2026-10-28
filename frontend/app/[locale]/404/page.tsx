import { notFound } from 'next/navigation';

// URL trang 404 theo bảng SEO (AuthGuard đẩy về đây khi thiếu quyền). Gọi notFound() để dùng chung
// app/[locale]/not-found.tsx với mọi URL lạ: cùng giao diện, tiêu đề, noindex và mã 404.
export default function NotFoundRoutePage() {
  notFound();
}
