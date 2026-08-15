'use client';

import classNames from 'classnames/bind';

import { getFullMediaUrl } from '@/app/utils/mediaUrl';
import styles from '@/app/features/tests/exam/exam-types/detail/testStart/examLayout/examLayout.module.scss';

const cx = classNames.bind(styles);

function BannerBlock({ url, showPlaceholder = false }) {
  if (!url) {
    return showPlaceholder ? (
      <div className={cx('bannerPlaceholder')}>Banner (chưa có ảnh)</div>
    ) : null;
  }
  return (
    <div className={cx('banner')}>
      <img src={getFullMediaUrl(url)} alt="Banner bài thi" />
    </div>
  );
}

export default BannerBlock;
