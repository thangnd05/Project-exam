// Suspense là BẮT BUỘC: Next yêu cầu mọi component dùng useSearchParams() phải nằm trong
// một ranh giới Suspense, nếu không trang sẽ không prerender được. Nó cũng thay luôn
// <Suspense> bọc <Routes> của App.js cũ.
import { Suspense } from 'react';

// Trang phải đăng nhập, chế độ tập trung: ẩn Footer và nút cuộn lên (đang luyện/đang xem kết quả ải).

import AuthGuard from '@/app/components/AuthGuard';
import DefaultLayout from '@/app/components/layouts/DefaultLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DefaultLayout hideFooter hideScrollToTop>
        <Suspense
      fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          Đang tải...
        </div>
      }
    >
      {children}
    </Suspense>
      </DefaultLayout>
    </AuthGuard>
  );
}
