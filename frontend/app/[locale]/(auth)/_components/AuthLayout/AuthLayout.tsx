'use client';

import Link, { usePathname } from '@/app/i18n/navigation';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import styles from '@/app/[locale]/(auth)/_components/AuthLayout/AuthLayout.module.scss';
import { SITE_NAME } from '@/app/constants/site';
import routes from '@/app/configs/Routes';

const cx = classNames.bind(styles);

function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations('Auth');

  if (pathname === routes.login) return <>{children}</>;

  return (
    <div className={cx('shell')}>
      <div className={cx('glow', 'glowA')} aria-hidden="true" />
      <div className={cx('glow', 'glowB')} aria-hidden="true" />

      <main className={cx('content')}>{children}</main>

      <footer className={cx('bottom')}>
        <nav className={cx('legal')} aria-label={t('common.legalNav')}>
          <Link href={routes.service}>{t('common.terms')}</Link>
          <span className={cx('divider')} aria-hidden="true">|</span>
          <Link href={routes.policy}>{t('common.privacy')}</Link>
        </nav>
        <p className={cx('copyright')}>© {SITE_NAME}. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default AuthLayout;
