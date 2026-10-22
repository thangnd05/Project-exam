'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';

import MediaImage from '@/app/components/MediaImage/MediaImage';
import { getFullMediaUrl } from '@/app/utils/mediaUrl';
import styles from '@/app/features/exam-layout/examLayout.module.scss';

const cx = classNames.bind(styles);

type BannerBlockProps = {
  url?: string;
  showPlaceholder?: boolean;
};

function BannerBlock({ url, showPlaceholder = false }: BannerBlockProps) {
  const t = useTranslations('TestTaking.examLayout');
  if (!url) {
    return showPlaceholder ? (
      <div className={cx('bannerPlaceholder')}>{t('bannerPlaceholder')}</div>
    ) : null;
  }
  return (
    <div className={cx('banner')}>
      <MediaImage src={getFullMediaUrl(url)} alt={t('bannerAlt')} width={1600} height={400} sizes="100vw" />
    </div>
  );
}

export default BannerBlock;
