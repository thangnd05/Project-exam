'use client';

import {useState} from 'react';
import Image, {type StaticImageData} from 'next/image';
import classNames from 'classnames/bind';
import styles from './DeviceMockup.module.scss';

const cx = classNames.bind(styles);

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

type DeviceMockupProps = {
  /** Ảnh chụp màn hình, import tĩnh từ app/assets/images để next/image có sẵn kích thước. */
  src?: StaticImageData;
  alt?: string;
  className?: string;
};

export default function DeviceMockup({src, alt = '', className}: DeviceMockupProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = src && !imgFailed;

  return (
    <div className={cx('viewport', className)}>
      <span className={cx('glow')} aria-hidden="true" />
      <span className={cx('shadow')} aria-hidden="true" />
      <div className={cx('laptop')}>
        <div className={cx('screen')}>
          <span className={cx('camera')} aria-hidden="true" />
          <div className={cx('display', {displayPlaceholder: !showImg})}>
            {showImg ? (
              // fill: khung .display đã có position/aspect-ratio, ảnh chỉ việc phủ kín.
              // sizes cho Next biết ảnh không bao giờ rộng quá ~640px để chọn bản nhỏ nhất.
              <Image
                className={cx('shot')}
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 900px) 100vw, 640px"
                placeholder="blur"
                draggable={false}
                onError={() => setImgFailed(true)}
              />
            ) : (
              <BrowserPlaceholder />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
