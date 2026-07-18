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
  children,
}) => {
  return (
    <div className={cx('headerHero', className)}>
      <div className={cx('heroContent')}>
        {label && <span className={cx('label', labelClassName)}>{label}</span>}
        <h1>{title}</h1>
        {description && <p className={cx('description')}>{description}</p>}
        {badgeLabel && <div className={cx('badge')}>{badgeLabel}</div>}
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
};

export default PageHeader;
