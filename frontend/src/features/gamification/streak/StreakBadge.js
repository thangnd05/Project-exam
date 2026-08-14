import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFire } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import style from './StreakBadge.module.scss';
import { useStreak } from '~/shared/hooks/useStreak';
import StreakRestoreModal from './StreakRestoreModal';

const cx = classNames.bind(style);

function StreakBadge({ className, variant = 'default' }) {
  const { currentStreak, lostStreak, canRecover } = useStreak();
  const [showRestore, setShowRestore] = useState(false);

  const active = currentStreak > 0;
  const recoverable = canRecover && lostStreak > 0;
  const display = recoverable ? lostStreak : currentStreak;

  const title = recoverable
    ? `Đã đứt chuỗi ${lostStreak} ngày  bấm để khôi phục`
    : active
      ? `Chuỗi ${currentStreak} ngày học liên tiếp`
      : 'Học hôm nay để bắt đầu chuỗi!';

  return (
    <>
      <div
        className={cx(
          'streakBadge',
          { active, recoverable },
          variant === 'onDark' && 'onDark',
          className
        )}
        title={title}
        role={recoverable ? 'button' : undefined}
        tabIndex={recoverable ? 0 : undefined}
        onClick={recoverable ? () => setShowRestore(true) : undefined}
        onKeyDown={
          recoverable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowRestore(true);
                }
              }
            : undefined
        }
      >
        <FontAwesomeIcon icon={faFire} className={cx('icon')} />
        <span className={cx('count')}>{display}</span>
      </div>
      {recoverable && (
        <StreakRestoreModal show={showRestore} onClose={() => setShowRestore(false)} />
      )}
    </>
  );
}

export default StreakBadge;
