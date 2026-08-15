'use client';

import classNames from 'classnames/bind';

import styles from './adminKit.module.scss';

const cx = classNames.bind(styles);

type AdminFieldErrorProps = {
  message?: React.ReactNode;
};

function AdminFieldError({message}: AdminFieldErrorProps) {
  if (!message) {
    return null;
  }
  return <p className={cx('errorText')}>{message}</p>;
}

export default AdminFieldError;
