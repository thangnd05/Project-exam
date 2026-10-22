'use client';

import { useState } from 'react';
import { Spinner, Button } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { IoLockClosedOutline, IoAlertCircleOutline, IoPlayCircleOutline } from 'react-icons/io5';
import { useExamTypeById } from '@/app/features/exam-types/hooks/useExamTypes';
import { getFullMediaUrl } from '@/app/utils/mediaUrl';
import styles from '@/app/features/exam-layout/TestStart.module.scss';

const cx = classNames.bind(styles);

function ExamTypeLogo({ examTypeId }: { examTypeId?: string }) {
  const { examType } = useExamTypeById(examTypeId);
  const [failed, setFailed] = useState(false);
  const src = getFullMediaUrl(examType?.imageUrl);

  if (!src || failed) return <IoPlayCircleOutline size={80} color="var(--primary)" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- logo do admin tải lên, host tuỳ ý và cần onError để hiện icon thay thế
    <img
      className={cx('ready-logo')}
      src={src}
      alt={examType?.name || ''}
      onError={() => setFailed(true)}
    />
  );
}

type TestStateScreensProps = {
  status: string;
  test: {
    title?: string;
    examTypeId?: string;
    durationMinutes?: number | null;
    costCoins?: number | null;
  };
  balance: number;
  purchasing: boolean;
  preCountdown: number | null;
  formatTime: (seconds: number | null) => string;
  onBack: () => void;
  onPurchase: () => void;
  onRetry?: () => void;
  questionCount?: number;
  partCount?: number;
  onStart?: () => void;
};

export default function TestStateScreens({
  status,
  test,
  balance,
  purchasing,
  preCountdown,
  formatTime,
  onBack,
  onPurchase,
  onRetry,
  questionCount = 0,
  partCount = 0,
  onStart,
}: TestStateScreensProps) {
  const t = useTranslations('TestTaking.start');
  const tCommon = useTranslations('Common');
  if (status === 'loading')
    return (
      <div className={cx('state-box')}>
        <Spinner animation="grow" variant="primary" />
        <h3>{t('loading')}</h3>
      </div>
    );

  if (status === 'ready') {
    const timed = (test.durationMinutes ?? 0) > 0;
    return (
      <div className={cx('state-box')}>
        <ExamTypeLogo examTypeId={test.examTypeId} />
        <h3>{test.title || t('ready.fallbackTitle')}</h3>
        <ul className={cx('ready-facts')}>
          <li>
            <span>
              {t.rich('ready.questionCount', {
                count: questionCount,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
              {partCount > 1 ? t('ready.partCount', { count: partCount }) : ''}
            </span>
          </li>
          <li>
            <span>
              {timed ? (
                t.rich('ready.timed', {
                  minutes: test.durationMinutes ?? 0,
                  strong: (chunks) => <strong>{chunks}</strong>,
                })
              ) : (
                t('ready.untimed')
              )}
            </span>
          </li>
          <li>
            <span>{t('ready.autosave')}</span>
          </li>
          <li>
            <span>
              {t.rich('ready.submitHint', { strong: (chunks) => <strong>{chunks}</strong> })}
              {timed && ` ${t('ready.autoSubmit')}`}
            </span>
          </li>
        </ul>
        <div className={cx('state-actions')}>
          <button
            type="button"
            className={cx('state-btn', 'state-btn-secondary')}
            onClick={onBack}
          >
            {t('back')}
          </button>
          <button
            type="button"
            className={cx('state-btn', 'state-btn-primary')}
            onClick={onStart}
          >
            {t('ready.start')}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'payment') {
    const cost = test.costCoins || 0;
    const enough = balance >= cost;
    return (
      <div className={cx('state-box')}>
        <IoLockClosedOutline size={80} color="var(--warning)" />
        <h3>{t('payment.title')}</h3>
        <p>
           {t('payment.desc')}
        </p>
        <div className={cx('state-actions')}>
          <button
            type="button"
            className={cx('state-btn', 'state-btn-secondary')}
            onClick={onBack}
          >
            {t('back')}
          </button>
          <button
            type="button"
            className={cx('state-btn', 'state-btn-primary')}
            disabled={purchasing || !enough}
            onClick={onPurchase}
          >
            {purchasing
              ? t('payment.unlocking')
              : enough
                ? t('payment.unlock', { cost })
                : t('payment.notEnough')}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'no-attempts')
    return (
      <div className={cx('state-box')}>
        <IoAlertCircleOutline size={80} color="var(--danger-text)" />
        <h3>{t('noAttempts.title')}</h3>
        <p>{t('noAttempts.desc')}</p>
        <Button
          variant="primary"
          className="mt-4 rounded-pill"
          onClick={onBack}
        >
          {t('back')}
        </Button>
      </div>
    );

  if (status === 'locked')
    return (
      <div className={cx('state-box')}>
        <IoLockClosedOutline size={80} color="var(--text-secondary)" />
        <h3>{t('locked.title')}</h3>
        <p>{t('locked.desc')}</p>
        <div className={cx('timer-box', 'mt-4')}>
          <span className={cx('time')}>{formatTime(preCountdown)}</span>
        </div>
      </div>
    );

  if (status === 'closed')
    return (
      <div className={cx('state-box')}>
        <IoAlertCircleOutline size={80} color="var(--danger-text)" />
        <h3>{t('closed.title')}</h3>
        <p>{t('closed.desc')}</p>
        <Button
          variant="secondary"
          className="mt-4 rounded-pill"
          onClick={onBack}
        >
          {t('back')}
        </Button>
      </div>
    );

  if (status === 'error')
    return (
      <div className={cx('state-box')}>
        <IoAlertCircleOutline size={80} color="var(--danger-text)" />
        <h3>{t('error.title')}</h3>
        <p>{t('error.desc')}</p>
        <div className={cx('state-actions')}>
          <button
            type="button"
            className={cx('state-btn', 'state-btn-secondary')}
            onClick={onBack}
          >
            {t('back')}
          </button>
          {onRetry && (
            <button
              type="button"
              className={cx('state-btn', 'state-btn-primary')}
              onClick={onRetry}
            >
              {tCommon('error.retry')}
            </button>
          )}
        </div>
      </div>
    );

  return null;
}
