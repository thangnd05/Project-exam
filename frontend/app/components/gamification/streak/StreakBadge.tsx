'use client';

import { useState } from 'react';
import classNames from 'classnames/bind';
import style from './StreakBadge.module.scss';
import { useStreak } from '@/app/hooks/useStreak';
import StreakRestoreModal from './StreakRestoreModal';

const cx = classNames.bind(style);

// Ngọn lửa theo mẫu FrostScope (heroicons solid fire).
function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.527.82-1.124 1.902-1.42 3.33-.294 1.417-.184 2.766.198 3.738.375.955.973 1.626 1.636 1.884.288.112.502.355.568.657a1.006 1.006 0 01-.424 1.042c-.446.31-1.076.416-1.78.318-1.43-.2-2.584-1.222-3.136-2.593-.16-.397-.565-.632-.988-.567-.423.064-.755.38-.813.805-.286 2.083.398 4.316 1.838 5.756C9.17 18.799 11.455 19.5 13.75 19.125c2.478-.405 4.542-2.222 5.093-4.667.57-2.529-.53-5.068-2.67-6.527-1.45-.989-2.735-2.589-3.268-4.417-.132-.453-.309-.728-.51-.961z"
      />
    </svg>
  );
}

type StreakBadgeProps = {
  className?: string;
  variant?: 'default' | 'onDark';
};

function StreakBadge({ className, variant = 'default' }: StreakBadgeProps) {
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
            ? (e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowRestore(true);
                }
              }
            : undefined
        }
      >
        <FlameIcon className={cx('icon')} />
        <span className={cx('count')}>{display}</span>
        <span className={cx('label')}>ngày liên tiếp</span>
      </div>
      {recoverable && (
        <StreakRestoreModal show={showRestore} onClose={() => setShowRestore(false)} />
      )}
    </>
  );
}

export default StreakBadge;
