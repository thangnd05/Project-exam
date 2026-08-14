import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from './PageHeader.module.scss';

const cx = classNames.bind(styles);

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
}) => {
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

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  label: PropTypes.string,
  badgeLabel: PropTypes.node,
  onAction: PropTypes.func,
  actionText: PropTypes.string,
  actionIcon: PropTypes.elementType,
  className: PropTypes.string,
  description: PropTypes.node,
  labelClassName: PropTypes.string,
  /* Khối riêng của trang, nằm ngay dưới tiêu đề (hàng badge, chip...) */
  meta: PropTypes.node,
  /* Khối riêng của trang, chạy hết chiều ngang dưới cùng banner (thanh tiến độ...) */
  footer: PropTypes.node,
  /* Banner gọn hơn (padding + tiêu đề nhỏ lại) */
  compact: PropTypes.bool,
};

export default PageHeader;
