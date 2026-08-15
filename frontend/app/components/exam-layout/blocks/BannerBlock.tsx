'use client';

import classNames from 'classnames/bind';

import { getFullMediaUrl } from '@/app/utils/mediaUrl';
import styles from '@/app/components/exam-layout/examLayout.module.scss';

const cx = classNames.bind(styles);

type BannerBlockProps = {
  url?: string;
  showPlaceholder?: boolean;
};

function BannerBlock({ url, showPlaceholder = false }: BannerBlockProps) {
  if (!url) {
    return showPlaceholder ? (
      <div className={cx('bannerPlaceholder')}>Banner (chưa có ảnh)</div>
    ) : null;
  }
  return (
    <div className={cx('banner')}>
      <img src={getFullMediaUrl(url) ?? undefined} alt="Banner bài thi" />
    </div>
  );
}

export default BannerBlock;
