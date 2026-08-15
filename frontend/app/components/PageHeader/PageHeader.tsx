'use client';

import classNames from 'classnames/bind';
import styles from './PageHeader.module.scss';

const cx = classNames.bind(styles);

type PageHeaderProps = {
  title: string;
  label?: string;
  badgeLabel?: React.ReactNode;
  onAction?: () => void;
  actionText?: string;
  actionIcon?: React.ElementType;
  onSecondaryAction?: () => void;
  secondaryActionText?: string;
  secondaryActionIcon?: React.ElementType;
  className?: string;
  description?: React.ReactNode;
  labelClassName?: string;
  /* Khối riêng của trang, nằm ngay dưới tiêu đề (hàng badge, chip...) */
  meta?: React.ReactNode;
  /* Khối riêng của trang, chạy hết chiều ngang dưới cùng banner (thanh tiến độ...) */
  footer?: React.ReactNode;
  /* Banner gọn hơn (padding + tiêu đề nhỏ lại) */
  compact?: boolean;
  children?: React.ReactNode;
};

const PageHeader = ({
  title,
  label,
  badgeLabel,
  onAction,
  actionText,
  actionIcon: Icon,
  onSecondaryAction,
  secondaryActionText,
  secondaryActionIcon: SecondaryIcon,
  className,
  description,
  labelClassName,
  meta,
  footer,
  compact = false,
  children,
}: PageHeaderProps) => {
  return (
    <div className={cx('headerHero', { hasFooter: Boolean(footer), compact }, className)}>
      {/* display:contents khi không có footer -> giữ nguyên layout của các trang cũ */}
      <div className={cx('heroMain')}>
        <div className={cx('heroContent')}>
          {label && <span className={cx('label', labelClassName)}>{label}</span>}
          <h1>{title}</h1>
          {description && <p className={cx('description')}>{description}</p>}
          {badgeLabel && <div className={cx('badge')}>{badgeLabel}</div>}
          {meta}
        </div>

        <div className={cx('actions-wrapper')}>
          {onAction && actionText && (
            <button className={cx('actionBtn')} onClick={onAction}>
              {Icon && <Icon size={24} />}
              {actionText}
            </button>
          )}
          {onSecondaryAction && secondaryActionText && (
            <button className={cx('actionBtn', 'secondary')} onClick={onSecondaryAction}>
              {SecondaryIcon && <SecondaryIcon size={24} />}
              {secondaryActionText}
            </button>
          )}
          {children}
        </div>
      </div>

      {footer && <div className={cx('heroFooter')}>{footer}</div>}
    </div>
  );
};

export default PageHeader;
