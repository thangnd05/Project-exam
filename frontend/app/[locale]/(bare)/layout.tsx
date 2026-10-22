import { Suspense } from 'react';
import Loading from '@/app/components/Loading/Loading';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <><Suspense fallback={<Loading />}>{children}</Suspense></>
  );
}
