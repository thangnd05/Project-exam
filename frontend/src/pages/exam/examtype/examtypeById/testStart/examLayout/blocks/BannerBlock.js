import classNames from 'classnames/bind';

import { getFullMediaUrl } from '~/utils/mediaUrl';
import styles from '../examLayout.module.scss';

const cx = classNames.bind(styles);

// Ảnh banner tuỳ chọn cho đầu trang làm bài. Không có URL: hiện placeholder khi ở editor.
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
