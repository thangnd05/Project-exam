import { Suspense } from 'react';
import Loading from '@/app/components/Loading/Loading';

import AuthGuard from '@/app/features/auth/AuthGuard/AuthGuard';
import DefaultLayout from '@/app/components/layouts/DefaultLayout';
import { PRIVATE_ROBOTS } from '@/app/i18n/metadata';

// Trang cá nhân / dữ liệu riêng của người dùng: không index, không mô tả (bỏ mô tả trang chủ kế thừa từ layout gốc).
export const metadata = { robots: PRIVATE_ROBOTS, description: null };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowGuest>
      <DefaultLayout>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </DefaultLayout>
    </AuthGuard>
  );
}
