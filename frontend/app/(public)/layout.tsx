// Suspense là BẮT BUỘC: Next yêu cầu mọi component dùng useSearchParams() phải nằm trong
// một ranh giới Suspense, nếu không trang sẽ không prerender được.
import { Suspense } from 'react';
import Loading from '@/app/components/Loading/Loading';

// Trang công khai: có Header/Footer, không cần đăng nhập.

import DefaultLayout from '@/app/components/layouts/DefaultLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DefaultLayout>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </DefaultLayout>
  );
}
