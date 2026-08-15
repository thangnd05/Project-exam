'use client';

import classNames from 'classnames/bind';

import styles from './adminKit.module.scss';
import AdminCard from './AdminCard';

const cx = classNames.bind(styles);

type StatCardGroupProps = {
  children?: React.ReactNode;
};

export function StatCardGroup({children}: StatCardGroupProps) {
  return <div className={cx('statGroup')}>{children}</div>;
}

type StatCardProps = {
  label: React.ReactNode;
  value: React.ReactNode;
};

export function StatCard({label, value}: StatCardProps) {
  return (
    <AdminCard className={cx('statCard')}>
      <span className={cx('statLabel')}>{label}</span>
      <span className={cx('statValue')}>{value}</span>
    </AdminCard>
  );
}

export default StatCard;
