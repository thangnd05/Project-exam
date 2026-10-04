import { Suspense } from 'react';
import Loading from '@/app/components/Loading/Loading';
import AuthLayout from '@/app/components/layouts/AuthLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthLayout>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </AuthLayout>
  );
}
