'use client';

import {Form} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Search} from 'lucide-react';

import styles from './adminKit.module.scss';

const cx = classNames.bind(styles);

function AdminSearchInput({
  value = '',
  onChange,
  placeholder = 'Tìm kiếm...',
  className,
  ...props
}) {
  return (
    <div className={cx('searchBox') + (className ? ` ${className}` : '')}>
      <Search size={16} className={cx('searchIcon')} />
      <Form.Control
        value={value}
        onChange={(event) => onChange && onChange(event.target.value)}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}

export default AdminSearchInput;
