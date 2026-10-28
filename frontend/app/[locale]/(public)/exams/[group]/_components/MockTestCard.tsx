'use client';

import Link from '@/app/i18n/navigation';
import classNamesBind from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { formatDayMonthTime } from '@/app/utils/format-date-time';
import { ArrowRight, Trophy } from 'lucide-react';
import TestModeModal from '@/app/features/tests/TestModeModal/TestModeModal';
import { useTestStart } from '@/app/features/tests/TestCard/hooks/useTestStart';
import type { TestResponse } from '@/app/types';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import styles from './MockTestCard.module.scss';
import { buildTestPath } from '@/app/configs/Routes';
import ButtonPrime from '@/app/components/Button/ButtonPrime';

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
  const t = useTranslations('ExamTypes.mockCard');
  const tTests = useTranslations('Tests');
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
      : t('unlimited');

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
                {test.owned ? tTests('owned') : tTests('coins', { count: test.costCoins ?? 0 })}
              </span>
            )}
            {guestAllowed === true && <span className={ui('pill', 'pillSuccess')}>{t('noAccount')}</span>}
            {showLeaderboard && (
              <Link
                href={buildTestPath(test, 'leaderboard')}
                className={cx('rankLink')}
                title={tTests('leaderboard')}
                aria-label={tTests('leaderboard')}
              >
                <Trophy size="1em" aria-hidden="true" />
              </Link>
            )}
          </span>
        </div>

        <span className={cx('index')}>{t('index', { index: String(index).padStart(2, '0') })}</span>
        <h3 className={cx('title')}>{test.title || t('fallbackTitle')}</h3>

        <div className={cx('stats')}>
          <div>
            {t('questions')} <span>{questions ?? '—'}</span>
          </div>
          <div>
            {t('duration')}{' '}
            <span>{test.durationMinutes != null ? t('minutes', { count: test.durationMinutes }) : t('untimed')}</span>
          </div>
          <div>
            {t('attempts')} <span>{attempts}</span>
          </div>
          <div>
            {t('deadline')}{' '}
            <span>
              {test.availableTo ? formatDayMonthTime(test.availableTo) : t('noDeadline')}
            </span>
          </div>
        </div>
      </div>

      <div className={cx('actions', { solo: !isAuthenticated })}>
        <ButtonPrime
          variant="ink"
          type="button"
          onClick={handleStart}
          disabled={!canStart}
        >
          {needsLogin && canStart ? tTests('loginToStart') : buttonText}
          {canStart && <ArrowRight size="1em" aria-hidden="true" />}
        </ButtonPrime>
        {isAuthenticated && (
          <ButtonPrime
            as="link"
            variant="soft"
            href={buildTestPath(test, 'history')}
          >
            {tTests('history')}
          </ButtonPrime>
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
