'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';

import styles from '@/app/features/exam-layout/TestStart.module.scss';

const cx = classNames.bind(styles);

// Còn dưới 5 phút thì đồng hồ chuyển màu cảnh báo.
const LOW_TIME_SECONDS = 5 * 60;

type TimerBlockProps = {
  timeLeft?: number | null;
  formatTime: (seconds: number) => string;
};

function TimerBlock({ timeLeft, formatTime }: TimerBlockProps) {
  const t = useTranslations('TestTaking.examLayout');
  if (timeLeft === null || timeLeft === undefined) return null;
  return (
    <div className={cx('exam-stat', 'exam-stat-time', { low: timeLeft <= LOW_TIME_SECONDS })}>
      <span className={cx('exam-stat-label')}>{t('timeLabel')}</span>
      <span className={cx('exam-stat-value')}>{formatTime(timeLeft)}</span>
    </div>
  );
}

export default TimerBlock;
