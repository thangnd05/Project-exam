'use client';

import { IoTimeOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';

// Các block dùng chung class của trang làm bài nên vẫn đọc scss ở features/tests (giữ nguyên giao diện).
import styles from '@/app/features/tests/exam/exam-types/detail/testStart/TestStartPage.module.scss';

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
