'use client';

import Link from 'next/link';
import { forwardRef } from 'react';
import classNames from 'classnames/bind';
import styles from './Button.module.scss';

const cx = classNames.bind(styles);

type ButtonPrimeProps = {
  as?: 'button' | 'link' | 'a';
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'dangerGhost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  // Các prop còn lại chuyển thẳng xuống button/Link/a (href, onClick, aria-*...)
  [key: string]: any;
};

const ButtonPrime = forwardRef<any, ButtonPrimeProps>(function ButtonPrime(
  {
    as = 'button',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const classes = cx(
    'button',
    variant,
    size,
    {
      fullWidth,
    },
    className,
  );

  if (as === 'link') {
    return (
      <Link ref={ref} className={classes} aria-disabled={disabled || loading} {...(rest as any)}>
        {loading ? 'Đang xử lý...' : children}
      </Link>
    );
  }

  if (as === 'a') {
    return (
      <a ref={ref} className={classes} aria-disabled={disabled || loading} {...rest}>
        {loading ? 'Đang xử lý...' : children}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading ? 'Đang xử lý...' : children}
    </button>
  );
});

export default ButtonPrime;
