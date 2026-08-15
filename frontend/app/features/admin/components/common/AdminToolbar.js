'use client';

import classNames from 'classnames/bind';
import styles from './adminKit.module.scss';
import AdminSearchInput from './AdminSearchInput';

const cx = classNames.bind(styles);

function AdminToolbar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  children,
}) {
  return (
    <div className={cx('toolbar')}>
      {onSearchChange && (
        <AdminSearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
      )}
      {children && <div className={cx('toolbarActions')}>{children}</div>}
    </div>
  );
}

export default AdminToolbar;
