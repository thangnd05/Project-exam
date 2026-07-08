import React from 'react';
import classNames from 'classnames/bind';

import styles from './adminKit.module.scss';

const cx = classNames.bind(styles);

function AdminFieldError({message}) {
  if (!message) {
    return null;
  }
  return <p className={cx('errorText')}>{message}</p>;
}

export default AdminFieldError;
