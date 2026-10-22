'use client';

import { Suspense } from 'react';
import Loading from '@/app/components/Loading/Loading';

import { usePathname } from '@/app/i18n/navigation';
import AuthGuard from '@/app/features/auth/AuthGuard/AuthGuard';
import AdminLayout from '@/app/[locale]/(admin)/_components/AdminLayout/AdminLayout';
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
