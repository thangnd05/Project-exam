'use client';

import Link from 'next/link';
import classNamesBind from 'classnames/bind';
import { FiArrowRight } from 'react-icons/fi';
import { IoTrophyOutline } from 'react-icons/io5';
import TestModeModal from '@/app/features/tests/TestModeModal/TestModeModal';
import { useTestStart } from '@/app/features/tests/TestCard/hooks/useTestStart';
import { formatDayMonthTime } from '@/app/utils/format-date-time';
import type { TestResponse } from '@/app/types';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import styles from './MockTestCard.module.scss';
import { buildTestPath } from '@/app/configs/Routes';

const cx = classNamesBind.bind(styles);
const ui = classNamesBind.bind(uiStyles);

type MockTestCardProps = {
  test: TestResponse;
  index: number;
  /** Nhãn góc trái, như "Full Mock" hoặc "Chứng chỉ". */
  kind: string;
  /** Số câu của đề full theo đề thật (nếu biết). */
  questions?: number;
  countdowns?: Record<string, number>;
};

// Thẻ một đề của kỳ thi, cùng khuôn thẻ ở Kho đề thi: nhãn, tên, hàng số liệu mono, nút ở đáy.
function MockTestCard({ test, index, kind, questions, countdowns }: MockTestCardProps) {
  const {
    status,
    statusLabel,
    buttonText,
    canStart,
    isAuthenticated,
    guestAllowed,
    needsLogin,
    showLeaderboard,
    handleStart,
    modeModal,
  } = useTestStart(test, countdowns);

  const attempts =
    test.maxAttempts != null && test.remainingAttempts != null
      ? `${test.remainingAttempts}/${test.maxAttempts}`
      : 'Không giới hạn';

  return (
    <article className={cx('card', { dimmed: !canStart })}>
      <div>
        <div className={cx('cardTop')}>
          <span className={cx('kind')}>{kind}</span>
          <span className={cx('topRight')}>
            {status !== 'open' && (
              <span className={ui('pill', status === 'locked' ? 'pillBrand' : 'pillWarning')}>
                {statusLabel}
              </span>
            )}
            {(test.costCoins ?? 0) > 0 && (
              <span className={ui('pill', test.owned ? 'pillSuccess' : 'pillWarning')}>
                {test.owned ? 'Đã mở khoá' : `${test.costCoins} xu`}
              </span>
            )}
            {guestAllowed === true && <span className={ui('pill', 'pillSuccess')}>Không cần tài khoản</span>}
            {showLeaderboard && (
              <Link
                href={buildTestPath(test, 'leaderboard')}
                className={cx('rankLink')}
                title="Bảng xếp hạng"
                aria-label="Bảng xếp hạng"
              >
                <IoTrophyOutline aria-hidden="true" />
              </Link>
            )}
          </span>
        </div>

        <span className={cx('index')}>Đề {String(index).padStart(2, '0')}</span>
        <h3 className={cx('title')}>{test.title || 'Đề thi thử'}</h3>

        <div className={cx('stats')}>
          <div>
            Câu: <span>{questions ?? '—'}</span>
          </div>
          <div>
            Thời gian: <span>{test.durationMinutes != null ? `${test.durationMinutes}p` : 'Tự do'}</span>
          </div>
          <div>
            Lượt: <span>{attempts}</span>
          </div>
          <div>
            Hạn: <span>{test.availableTo ? formatDayMonthTime(test.availableTo) : 'Không'}</span>
          </div>
        </div>
      </div>

      <div className={cx('actions', { solo: !isAuthenticated })}>
        <button
          type="button"
          className={ui('btnPrimary')}
          onClick={handleStart}
          disabled={!canStart}
        >
          {needsLogin && canStart ? 'Đăng nhập để làm' : buttonText}
          {canStart && <FiArrowRight aria-hidden="true" />}
        </button>
        {isAuthenticated && (
          <Link
            href={buildTestPath(test, 'history')}
            className={ui('btnSecondary')}
          >
            Lịch sử
          </Link>
        )}
      </div>

      <TestModeModal
        show={modeModal.show}
        test={test}
        onClose={modeModal.onClose}
        onStart={modeModal.onStart}
      />
    </article>
  );
}

export default MockTestCard;
