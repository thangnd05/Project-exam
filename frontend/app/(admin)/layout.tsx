'use client';

import { Suspense } from 'react';

// Khu quản trị. Quyền khác nhau theo từng trang nên không khai cứng được ở đây —
// tra theo pathname trong bảng adminPermissionByPath, đúng như bản react-router cũ làm.
//
// Lưu ý: /admin/create-test-from-bank và /admin/personal-question-bank tuy nằm dưới /admin
// nhưng là trang của người dùng thường (chỉ cần đăng nhập), nên chúng nằm ở nhóm (user)
// chứ không ở đây — route group của Next không ảnh hưởng tới URL nên hai nhánh cùng tồn tại được.

import { usePathname } from 'next/navigation';
import AuthGuard from '@/app/components/AuthGuard';
import AdminLayout from '@/app/components/layouts/AdminLayout';
import { findAdminPermission } from '@/app/configs/adminPermissions';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const permission = findAdminPermission(pathname);

  return (
    <AuthGuard requiredPermission={permission}>
      <AdminLayout><Suspense
      fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          Đang tải...
        </div>
      }
    >
      {children}
    </Suspense></AdminLayout>
    </AuthGuard>
  );
}
