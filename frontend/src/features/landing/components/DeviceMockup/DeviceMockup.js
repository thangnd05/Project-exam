import {useState} from 'react';
import classNames from 'classnames/bind';
import styles from './DeviceMockup.module.scss';

const cx = classNames.bind(styles);

// Số phím mỗi hàng của bàn phím (chỉ để dựng hình).
const KEY_ROWS = [13, 13, 13, 12];

// On-brand placeholder page shown inside the screen until a real
// website screenshot is passed via the `src` prop.
function BrowserPlaceholder() {
  return (
    <div className={cx('browser')} aria-hidden="true">
      <div className={cx('chrome')}>
        <span className={cx('trafficDot', 'red')} />
        <span className={cx('trafficDot', 'amber')} />
        <span className={cx('trafficDot', 'green')} />
        <span className={cx('urlbar')} />
      </div>
      <div className={cx('page')}>
        <div className={cx('pageHeader')}>
          <span className={cx('logoPill')} />
          <span className={cx('navPill')} />
          <span className={cx('navPill')} />
        </div>
        <div className={cx('pageHero')}>
          <span className={cx('heroLine', 'w70')} />
          <span className={cx('heroLine', 'w45')} />
          <span className={cx('heroBtn')} />
        </div>
        <div className={cx('pageCards')}>
          <span className={cx('card')} />
          <span className={cx('card')} />
          <span className={cx('card')} />
        </div>
      </div>
    </div>
  );
}

/**
 * Khung MacBook mở (màn hình + bàn phím phối cảnh). Truyền `src` là ảnh chụp
 * website để hiển thị trong màn hình; bỏ trống sẽ dùng placeholder theo brand.
 */
export default function DeviceMockup({src, alt = '', className}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = src && !imgFailed;

  return (
    <div className={cx('viewport', className)}>
      <span className={cx('glow')} aria-hidden="true" />
      <span className={cx('shadow')} aria-hidden="true" />
      <div className={cx('laptop')}>
        <div className={cx('screen')}>
          <span className={cx('camera')} aria-hidden="true" />
          <div className={cx('display')}>
            {showImg ? (
              <img
                className={cx('shot')}
                src={src}
                alt={alt}
                onError={() => setImgFailed(true)}
              />
            ) : (
              <BrowserPlaceholder />
            )}
            <span className={cx('glare')} aria-hidden="true" />
          </div>
        </div>

        <div className={cx('deck')} aria-hidden="true">
          <div className={cx('keyboard')}>
            {KEY_ROWS.map((n, r) => (
              <div key={r} className={cx('keyRow')}>
                {Array.from({length: n}).map((_, i) => (
                  <span key={i} className={cx('key')} />
                ))}
              </div>
            ))}
            <div className={cx('keyRow')}>
              <span className={cx('key', 'spacebar')} />
            </div>
          </div>
          <span className={cx('trackpad')} />
        </div>
      </div>
    </div>
  );
}
