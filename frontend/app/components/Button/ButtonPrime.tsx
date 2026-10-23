'use client';

import Link from '@/app/i18n/navigation';
import { forwardRef } from 'react';
import { useTranslations } from 'next-intl';
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
  variant?: 'primary' | 'brand' | 'outline' | 'ghost' | 'danger' | 'dangerGhost' | 'success';
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
  const tCommon = useTranslations('Common');
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
        {loading ? tCommon('processing') : children}
      </Link>
    );
  }

  if (as === 'a') {
    return (
      <a ref={ref as Ref<HTMLAnchorElement>} className={classes} aria-disabled={disabled || loading} {...rest}>
        {loading ? tCommon('processing') : children}
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
      {loading ? tCommon('processing') : children}
    </button>
  );
});

export default ButtonPrime;
