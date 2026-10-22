import { Suspense } from 'react';
import Loading from '@/app/components/Loading/Loading';

import DefaultLayout from '@/app/components/layouts/DefaultLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DefaultLayout>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </DefaultLayout>
  );
}
