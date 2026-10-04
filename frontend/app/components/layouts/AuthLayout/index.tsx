'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import classNames from 'classnames/bind';
import styles from './AuthLayout.module.scss';
import { imageAssets, name } from '@/app/assets/images';
import routes from '@/app/configs/Routes';

const cx = classNames.bind(styles);

function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showBrand = pathname !== routes.forgot && pathname !== routes.reset;

  return (
    <div className={cx('shell')}>
      <div className={cx('glow', 'glowA')} aria-hidden="true" />
      <div className={cx('glow', 'glowB')} aria-hidden="true" />

      <header className={cx('top', { brandInCard: pathname === routes.login })}>
        {showBrand && (
          <Link href={routes.home} className={cx('brand')} aria-label={`Về trang chủ ${name}`}>
            <Image src={imageAssets.logoW} alt="" width={44} height={28} priority />
            <span>{name}</span>
          </Link>
        )}
      </header>

      <main className={cx('content')}>{children}</main>

      <footer className={cx('bottom')}>
        <nav className={cx('legal')} aria-label="Thông tin pháp lý">
          <Link href={routes.service}>Điều khoản</Link>
          <span className={cx('divider')} aria-hidden="true">|</span>
          <Link href={routes.policy}>Quyền riêng tư</Link>
        </nav>
        <p className={cx('copyright')}>© {name} Exam. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default AuthLayout;
