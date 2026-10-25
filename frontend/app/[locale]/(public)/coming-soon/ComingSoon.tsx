'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { FiArrowRight, FiClock } from 'react-icons/fi';
import routes from '@/app/configs/Routes';
import Link from '@/app/i18n/navigation';
import type { Provider } from '../_lib/providers';
import styles from './ComingSoon.module.scss';

const cx = classNames.bind(styles);

// Có provider thì luôn hiện logo hãng; không có (hoặc slug lạ) thì hiện đồng hồ.
// Câu "Đề luyện thi {hãng} đang được chuẩn bị" chỉ đúng với hãng chưa có đề nào; hãng đã có đề
// (vd AWS, khi bấm một chứng chỉ sắp ra mắt) dùng câu chung cho riêng đề đó.
export default function ComingSoon({ provider }: { provider?: Provider }) {
  const t = useTranslations('Common.comingSoon');
  const upcomingProvider = provider && !provider.available ? provider : undefined;

  return (
    <section className={cx('wrapper', 'theme-locked')}>
      <div className={cx('ambient')} aria-hidden="true" />

      <div className={cx('emblem')}>
        <span className={cx('track', 'trackOuter')} aria-hidden="true" />
        <span className={cx('track', 'trackInner')} aria-hidden="true" />
        <div className={cx('core')}>
          {provider ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/images/providers/${provider.file}.webp`}
              alt={provider.name}
              className={cx('logo', `logo-${provider.size}`)}
            />
          ) : (
            <FiClock className={cx('fallbackIcon')} aria-hidden="true" />
          )}
        </div>
      </div>

      <p className={cx('eyebrow')}>{t('badge')}</p>

      <h1 className={cx('title')}>
        {upcomingProvider
          ? t.rich('titleProvider', {
              name: upcomingProvider.name,
              glow: (chunks) => <span className={cx('glow')}>{chunks}</span>,
            })
          : t('title')}
      </h1>

      <p className={cx('desc')}>
        {upcomingProvider
          ? t('descriptionProvider', { name: upcomingProvider.name })
          : t('description')}
      </p>

      <div className={cx('actions')}>
        <Link href={routes.examTypes} className={cx('btnPrimary')}>
          {t('exploreExams')}
          <FiArrowRight aria-hidden="true" />
        </Link>
        <Link href={routes.home} className={cx('btnGhost')}>
          {t('backHome')}
        </Link>
      </div>
    </section>
  );
}
