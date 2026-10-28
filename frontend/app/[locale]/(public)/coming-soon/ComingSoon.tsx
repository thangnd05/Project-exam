'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { ArrowRight, Clock } from 'lucide-react';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import routes from '@/app/configs/Routes';
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
            <Clock size="1em" className={cx('fallbackIcon')} aria-hidden="true" />
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
        <ButtonPrime as="link" href={routes.examTypes} size="lg" className={cx('ctaArrow')}>
          {t('exploreExams')}
          <ArrowRight size="1em" aria-hidden="true" />
        </ButtonPrime>
        <ButtonPrime as="link" href={routes.home} variant="onDark" size="lg">
          {t('backHome')}
        </ButtonPrime>
      </div>
    </section>
  );
}
