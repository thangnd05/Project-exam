'use client';

import Link from 'next/link';
import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, Ref } from 'react';
import classNames from 'classnames/bind';
import styles from './Button.module.scss';

const cx = classNames.bind(styles);

// Props gốc của <button>/<a> được truyền thẳng xuống phần tử render ra (onClick, href, target...).
// Dùng HTMLElement cho event handler vì cùng props có thể render ra <button>, <a> hoặc <Link>.
type NativeProps = Omit<ButtonHTMLAttributes<HTMLElement>, 'type'> &
  Pick<AnchorHTMLAttributes<HTMLElement>, 'href' | 'target' | 'rel' | 'download' | 'hrefLang'>;

type ButtonPrimeProps = NativeProps & {
  as?: 'button' | 'link' | 'a';
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'dangerGhost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
};

const ButtonPrime = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonPrimeProps>(function ButtonPrime(
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
    const { href = '', ...linkRest } = rest;
    return (
      <Link
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        aria-disabled={disabled || loading}
        {...linkRest}
      >
        {loading ? 'Đang xử lý...' : children}
      </Link>
    );
  }

  if (as === 'a') {
    return (
      <a ref={ref as Ref<HTMLAnchorElement>} className={classes} aria-disabled={disabled || loading} {...rest}>
        {loading ? 'Đang xử lý...' : children}
      </a>
    );
  }

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
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
