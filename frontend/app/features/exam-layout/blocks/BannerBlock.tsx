'use client';

import classNames from 'classnames/bind';

import MediaImage from '@/app/components/MediaImage/MediaImage';
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
      <MediaImage src={getFullMediaUrl(url)} alt="Banner bài thi" width={1600} height={400} sizes="100vw" />
    </div>
  );
}

export default BannerBlock;
