import { notFound } from 'next/navigation';

// Đường dẫn không khớp route nào vẫn đi qua [locale]/layout, để trang 404 có đủ giao diện và đúng ngôn ngữ.
export default function CatchAllPage() {
  notFound();
}
