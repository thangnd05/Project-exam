import type { LucideIcon } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './EmptyState.module.scss';

const cx = classNames.bind(styles);

type EmptyStateProps = {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  // Nút/link hành động (thử lại, xoá bộ lọc, đi tới trang khác...).
  action?: React.ReactNode;
  // danger: lỗi tải dữ liệu; neutral: chưa có dữ liệu / không khớp bộ lọc.
  tone?: 'neutral' | 'danger';
  // compact: đặt trong thẻ/modal, bỏ khung nét đứt và giảm khoảng đệm.
  compact?: boolean;
  className?: string;
};

// Trạng thái rỗng/lỗi dùng chung cho vùng nội dung chính của trang (danh sách, lưới, bảng tự dựng).
// Ô "chưa có dữ liệu" nhỏ bên trong biểu đồ/thẻ thống kê không cần dùng component này.
function EmptyState({ icon: Icon, title, description, action, tone = 'neutral', compact = false, className }: EmptyStateProps) {
  return (
    <div className={cx('wrapper', tone, { compact }, className)} role={tone === 'danger' ? 'alert' : undefined}>
      {Icon && <Icon size="1em" className={cx('icon')} aria-hidden="true" />}
      <h3 className={cx('title')}>{title}</h3>
      {description && <p className={cx('description')}>{description}</p>}
      {action && <div className={cx('action')}>{action}</div>}
    </div>
  );
}

export default EmptyState;
