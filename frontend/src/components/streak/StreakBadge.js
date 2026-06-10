import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFire } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import style from './StreakBadge.module.scss';
import { useStreak } from '~/hooks/useStreak';
import StreakRestoreModal from './StreakRestoreModal';

const cx = classNames.bind(style);

// Badge 🔥 hiển thị số ngày streak. Khi chuỗi đứt mà còn khôi phục được thì hiện
// đúng số ngày đã mất (mờ đi) và cho bấm để khôi phục bằng xu.
function StreakBadge({ className }) {
  const { currentStreak, lostStreak, canRecover } = useStreak();
  const [showRestore, setShowRestore] = useState(false);

  const active = currentStreak > 0;
  const recoverable = canRecover && lostStreak > 0;
  const display = recoverable ? lostStreak : currentStreak;

  const title = recoverable
    ? `Đã đứt chuỗi ${lostStreak} ngày — bấm để khôi phục`
    : active
      ? `Chuỗi ${currentStreak} ngày học liên tiếp`
      : 'Học hôm nay để bắt đầu chuỗi!';

  return (
    <>
      <div
        className={cx('streakBadge', { active, recoverable }, className)}
        title={title}
        role={recoverable ? 'button' : undefined}
        onClick={recoverable ? () => setShowRestore(true) : undefined}
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
