// Suspense là BẮT BUỘC: Next yêu cầu mọi component dùng useSearchParams() phải nằm trong
// một ranh giới Suspense, nếu không trang sẽ không prerender được.
import { Suspense } from 'react';
import Loading from '@/app/components/Loading/Loading';

// Trang phải đăng nhập, bố cục thường.

import AuthGuard from '@/app/components/AuthGuard';
import DefaultLayout from '@/app/components/layouts/DefaultLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DefaultLayout>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </DefaultLayout>
    </AuthGuard>
  );
}
