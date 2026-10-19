'use client';

import { IoCheckmarkCircleOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';

import styles from '@/app/components/exam-layout/TestStart.module.scss';

const cx = classNames.bind(styles);

type ProgressBlockProps = {
  answered: number;
  total: number;
};

function ProgressBlock({ answered, total }: ProgressBlockProps) {
  return (
    <div className={cx('exam-stat', 'exam-stat-done')}>
      <IoCheckmarkCircleOutline aria-hidden />
      <span className={cx('exam-stat-value')}>
        {answered}/{total}
      </span>
    </div>
  );
}

export default ProgressBlock;
