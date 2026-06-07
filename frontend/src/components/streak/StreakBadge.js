import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFire } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import style from './StreakBadge.module.scss';
import { useStreak } from '~/hooks/useStreak';

const cx = classNames.bind(style);

// Badge 🔥 hiển thị số ngày streak. Tắt lửa (xám) khi streak = 0.
function StreakBadge({ className }) {
  const { currentStreak } = useStreak();
  const active = currentStreak > 0;

  return (
    <div
      className={cx('streakBadge', { active }, className)}
      title={active ? `Chuỗi ${currentStreak} ngày học liên tiếp` : 'Học hôm nay để bắt đầu chuỗi!'}
    >
      <FontAwesomeIcon icon={faFire} className={cx('icon')} />
      <span className={cx('count')}>{currentStreak}</span>
    </div>
  );
}

export default StreakBadge;
