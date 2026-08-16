import { Suspense } from 'react';
import Loading from '@/app/components/Loading/Loading';

import AuthGuard from '@/app/components/AuthGuard/AuthGuard';
import DefaultLayout from '@/app/components/layouts/DefaultLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowGuest>
      <DefaultLayout>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </DefaultLayout>
    </AuthGuard>
  );
}
