'use client';

import classNames from 'classnames/bind';

import styles from './adminKit.module.scss';
import AdminCard from './AdminCard';

const cx = classNames.bind(styles);

export function StatCardGroup({children}) {
  return <div className={cx('statGroup')}>{children}</div>;
}

export function StatCard({label, value}) {
  return (
    <AdminCard className={cx('statCard')}>
      <span className={cx('statLabel')}>{label}</span>
      <span className={cx('statValue')}>{value}</span>
    </AdminCard>
  );
}

export default StatCard;
