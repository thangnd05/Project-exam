'use client';

import {Form, type FormControlProps} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Search} from 'lucide-react';
import {useTranslations} from 'next-intl';

import styles from './adminKit.module.scss';

const cx = classNames.bind(styles);

type AdminSearchInputProps = Omit<FormControlProps, 'value' | 'onChange'> & {
  value?: string;
  onChange?: (value: string) => void;
};

function AdminSearchInput({
  value = '',
  onChange,
  placeholder,
  className,
  ...props
}: AdminSearchInputProps) {
  const t = useTranslations('AdminCommon');
  return (
    <div className={cx('searchBox') + (className ? ` ${className}` : '')}>
      <Search size={16} className={cx('searchIcon')} />
      <Form.Control
        value={value}
        onChange={(event) => onChange && onChange(event.target.value)}
        placeholder={placeholder ?? t('searchPlaceholder')}
        {...props}
      />
    </div>
  );
}

export default AdminSearchInput;
