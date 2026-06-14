import React from 'react';
import classNames from 'classnames/bind';

import styles from './adminKit.module.scss';

const cx = classNames.bind(styles);

/** Panel trắng bo góc + viền chuẩn admin, dùng cho form/cấu hình. */
function AdminCard({children, maxWidth, className, style}) {
  return (
    <div
      className={cx('card') + (className ? ` ${className}` : '')}
      style={maxWidth ? {maxWidth, ...style} : style}
    >
      {children}
    </div>
  );
}

export default AdminCard;
