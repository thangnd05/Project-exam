'use client';

import { usePathname, useRouter } from '@/app/i18n/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Spinner } from 'react-bootstrap';
import routes from '@/app/configs/Routes';
import { useAuth } from '@/app/hooks/useAuth';

type FallbackProps = {
  label: string;
};

function Fallback({ label }: FallbackProps) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.2rem',
      }}
    >
      <Spinner animation="border" variant="primary" />
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
}

type AuthGuardProps = {
  children: React.ReactNode;
  requiredPermission?: string;
  allowGuest?: boolean;
};

function AuthGuard({ children, requiredPermission, allowGuest = false }: AuthGuardProps) {
  const { isAuthenticated, loading, permissions } = useAuth();
  const t = useTranslations('Auth');
  const router = useRouter();
  const pathname = usePathname();

  const needsLogin = !loading && !isAuthenticated && !allowGuest;
  const lacksPermission =
    !loading &&
    isAuthenticated &&
    requiredPermission &&
    !(Array.isArray(permissions) && permissions.includes(requiredPermission));

  useEffect(() => {
    if (needsLogin) {
      const params = new URLSearchParams({
        from: pathname,
        flash: t('guard.loginRequired'),
      });
      router.replace(`${routes.login}?${params.toString()}`);
    } else if (lacksPermission) {
      router.replace(routes.notFoundPage);
    }
  }, [needsLogin, lacksPermission, pathname, router, t]);

  if (loading) return <Fallback label={t('guard.checking')} />;
  if (needsLogin || lacksPermission) return <Fallback label={t('guard.redirecting')} />;

  return children;
}

export default AuthGuard;
