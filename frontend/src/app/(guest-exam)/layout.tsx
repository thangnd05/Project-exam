// Suspense là BẮT BUỘC: Next yêu cầu mọi component dùng useSearchParams() phải nằm trong
// một ranh giới Suspense, nếu không trang sẽ không prerender được. Nó cũng thay luôn
// <Suspense> bọc <Routes> của App.js cũ.
import { Suspense } from 'react';

// Đang làm bài: ẩn cả Header, bỏ container để đề chiếm trọn màn hình.

import AuthGuard from '~/shared/ui/AuthGuard';
import DefaultLayout from '~/layout/DefaultLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowGuest>
      <DefaultLayout noContainer hideFooter hideScrollToTop examMode>
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
