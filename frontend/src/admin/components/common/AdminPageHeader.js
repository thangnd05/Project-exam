import React from 'react';
import classNames from 'classnames/bind';

import styles from './adminKit.module.scss';

const cx = classNames.bind(styles);

/**
 * Tiêu đề chuẩn cho trang admin: tên trang + mô tả (trái), slot hành động (phải).
 * children thường là nút "Thêm mới".
 */
function AdminPageHeader({title, description, children}) {
  return (
    <div className={cx('header')}>
      <div className={cx('headingGroup')}>
        <h1 className={cx('title')}>{title}</h1>
        {description && <p className={cx('description')}>{description}</p>}
      </div>
      {children && <div className={cx('headerActions')}>{children}</div>}
    </div>
  );
}

export default AdminPageHeader;
