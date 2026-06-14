import React from 'react';
import classNames from 'classnames/bind';

import styles from './adminKit.module.scss';

const cx = classNames.bind(styles);

/** Lưới thẻ thống kê tự co giãn. */
export function StatCardGroup({children}) {
  return <div className={cx('statGroup')}>{children}</div>;
}

/**
 * Thẻ thống kê: số liệu + nhãn + icon.
 * tone: blue | green | amber | violet | red
 */
export function StatCard({label, value, icon: Icon, tone = 'blue'}) {
  return (
    <div className={cx('statCard', tone)}>
      {Icon && (
        <div className={cx('statIcon')}>
          <Icon size={20} />
        </div>
      )}
      <div className={cx('statBody')}>
        <span className={cx('statValue')}>{value}</span>
        <span className={cx('statLabel')}>{label}</span>
      </div>
    </div>
  );
}

export default StatCard;
