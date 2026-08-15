'use client';

import { IoTimeOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';

// Các block dùng chung class của trang làm bài; scss đặt cạnh engine để bớt import chéo.
import styles from '@/app/components/exam-layout/TestStart.module.scss';

const cx = classNames.bind(styles);

type TimerBlockProps = {
  timeLeft?: number | null;
  formatTime: (seconds: number) => string;
};

function TimerBlock({ timeLeft, formatTime }: TimerBlockProps) {
  if (timeLeft === null || timeLeft === undefined) return null;
  return (
    <div className={cx('exam-stat', 'exam-stat-time')}>
      <IoTimeOutline aria-hidden />
      <span className={cx('exam-stat-value')}>{formatTime(timeLeft)}</span>
    </div>
  );
}

export default TimerBlock;
