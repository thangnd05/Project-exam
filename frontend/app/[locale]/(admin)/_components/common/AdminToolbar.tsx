'use client';

import classNames from 'classnames/bind';
import styles from './adminKit.module.scss';
import AdminSearchInput from './AdminSearchInput';

const cx = classNames.bind(styles);

type AdminToolbarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
};

function AdminToolbar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  children,
}: AdminToolbarProps) {
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
