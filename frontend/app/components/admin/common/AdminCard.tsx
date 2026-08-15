'use client';

import classNames from 'classnames/bind';

import styles from './adminKit.module.scss';

const cx = classNames.bind(styles);

type AdminCardProps = {
  children?: React.ReactNode;
  maxWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

function AdminCard({children, maxWidth, className, style}: AdminCardProps) {
  return (
    <div
      className={cx('card') + (className ? ` ${className}` : '')}
      style={maxWidth ? {maxWidth, ...style} : style}
    >
      {children}
    </div>
  );
}

export default AdminCard;
