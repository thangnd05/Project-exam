// Suspense là BẮT BUỘC: Next yêu cầu mọi component dùng useSearchParams() phải nằm trong
// một ranh giới Suspense, nếu không trang sẽ không prerender được.
import { Suspense } from 'react';
import Loading from '@/app/components/Loading/Loading';

// Đang làm bài: ẩn cả Header, bỏ container để đề chiếm trọn màn hình.

import AuthGuard from '@/app/components/AuthGuard';
import DefaultLayout from '@/app/components/layouts/DefaultLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowGuest>
      <DefaultLayout noContainer hideFooter hideScrollToTop examMode>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </DefaultLayout>
    </AuthGuard>
  );
}
