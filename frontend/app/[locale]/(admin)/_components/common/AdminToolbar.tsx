'use client';

import classNames from 'classnames/bind';
import {useTranslations} from 'next-intl';
import styles from './adminKit.module.scss';
import AdminSearchInput from './AdminSearchInput';

const cx = classNames.bind(styles);

type AdminToolbarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  /** Hàng lọc phụ trải hết bề ngang dưới ô tìm kiếm, vd. bộ chọn kỳ thi. */
  filters?: React.ReactNode;
};

function AdminToolbar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder,
  children,
  filters,
}: AdminToolbarProps) {
  const t = useTranslations('AdminCommon');
  return (
    <div className={cx('toolbar')}>
      {onSearchChange && (
        <AdminSearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder ?? t('searchPlaceholder')}
        />
      )}
      {children && <div className={cx('toolbarActions')}>{children}</div>}
      {filters && <div className={cx('toolbarFilters')}>{filters}</div>}
    </div>
  );
}

export default AdminToolbar;
