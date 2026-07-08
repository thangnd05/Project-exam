import { IoTimeOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';

import styles from '../../TestStartPage.module.scss';

const cx = classNames.bind(styles);

// Đồng hồ đếm ngược. Ẩn khi không giới hạn giờ (timeLeft === null).
function TimerBlock({ timeLeft, formatTime }) {
  if (timeLeft === null || timeLeft === undefined) return null;
  return (
    <div className={cx('exam-stat', 'exam-stat-time')}>
      <IoTimeOutline aria-hidden />
      <span className={cx('exam-stat-value')}>{formatTime(timeLeft)}</span>
    </div>
  );
}

export default TimerBlock;
