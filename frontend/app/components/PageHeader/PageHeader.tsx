'use client';

import classNames from 'classnames/bind';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
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
  meta?: React.ReactNode;
  footer?: React.ReactNode;
  compact?: boolean;
  // flat: đầu trang phẳng kiểu FrostScope (mặc định cho trang người dùng, cùng khuôn Kho đề thi / Mục tiêu).
  // band: dải gradient brand, chỉ khu admin dùng (qua AdminPageHeader).
  variant?: 'flat' | 'band';
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
  variant = 'flat',
  children,
}: PageHeaderProps) => {
  const band = variant === 'band';
  // Kiểu phẳng không gắn icon trang trí vào nút hành động.
  const showIcons = band;

  return (
    <header
      className={cx(
        band ? 'headerHero' : 'flatHead',
        { 'theme-locked': band, hasFooter: Boolean(footer), compact },
        className,
      )}
    >
      <div className={cx('heroMain')}>
        <div className={cx('heroContent')}>
          {label && <span className={cx('label', labelClassName)}>{label}</span>}
          <h1>{title}</h1>
          {description && <p className={cx('description')}>{description}</p>}
          {badgeLabel && <div className={cx('badge')}>{badgeLabel}</div>}
          {meta}
        </div>

        {(onAction || onSecondaryAction || children) && (
          <div className={cx('actions-wrapper')}>
            {onAction && actionText && (
              <ButtonPrime variant="ink" className={cx('actionBtn')} onClick={onAction}>
                {showIcons && Icon && <Icon size={24} />}
                {actionText}
              </ButtonPrime>
            )}
            {onSecondaryAction && secondaryActionText && (
              <ButtonPrime variant="outline" className={cx('actionBtn')} onClick={onSecondaryAction}>
                {showIcons && SecondaryIcon && <SecondaryIcon size={24} />}
                {secondaryActionText}
              </ButtonPrime>
            )}
            {children}
          </div>
        )}
      </div>

      {footer && <div className={cx('heroFooter')}>{footer}</div>}
    </header>
  );
};

export default PageHeader;
