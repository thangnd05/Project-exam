'use client';

import { Suspense } from 'react';
import Loading from '@/app/components/Loading/Loading';

import { usePathname } from 'next/navigation';
import AuthGuard from '@/app/components/AuthGuard/AuthGuard';
import AdminLayout from '@/app/components/layouts/AdminLayout';
import { findAdminPermission } from '@/app/configs/adminPermissions';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const permission = findAdminPermission(pathname);

  return (
    <AuthGuard requiredPermission={permission}>
      <AdminLayout>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </AdminLayout>
    </AuthGuard>
  );
}
