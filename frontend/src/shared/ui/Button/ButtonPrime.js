import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Button.module.scss';

const cx = classNames.bind(styles);

const ButtonPrime = forwardRef(function ButtonPrime(
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
      <Link ref={ref} className={classes} aria-disabled={disabled || loading} {...rest}>
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
