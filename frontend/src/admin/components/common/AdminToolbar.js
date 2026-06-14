import React from 'react';
import {Form} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Search} from 'lucide-react';

import styles from './adminKit.module.scss';

const cx = classNames.bind(styles);

/**
 * Thanh công cụ: ô tìm kiếm có icon (trái) + slot children (phải, vd filter/nút).
 * Bỏ qua ô search bằng cách không truyền onSearchChange.
 */
function AdminToolbar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  children,
}) {
  return (
    <div className={cx('toolbar')}>
      {onSearchChange && (
        <div className={cx('searchBox')}>
          <Search size={16} className={cx('searchIcon')} />
          <Form.Control
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
      )}
      {children && <div className={cx('toolbarActions')}>{children}</div>}
    </div>
  );
}

export default AdminToolbar;
