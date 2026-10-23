'use client';

import { useState } from 'react';
import { Spinner, Button } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { IoLockClosedOutline, IoAlertCircleOutline, IoPlayCircleOutline } from 'react-icons/io5';
import { useExamTypeById } from '@/app/features/exam-types/hooks/useExamTypes';
import { getFullMediaUrl } from '@/app/utils/mediaUrl';
import { QuestionType } from '@/app/enums';
import styles from '@/app/features/exam-layout/TestStart.module.scss';

const cx = classNames.bind(styles);

const QUESTION_TYPE_ORDER = [
  QuestionType.MCQ,
  QuestionType.MSQ,
  QuestionType.FILL_BLANK,
  QuestionType.ESSAY,
];

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
    maxAttempts?: number | null;
    remainingAttempts?: number | null;
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
  questionTypes?: QuestionType[];
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
  questionTypes = [],
  onStart,
}: TestStateScreensProps) {
  const t = useTranslations('TestTaking.start');
  const tCommon = useTranslations('Common');
  const { examType } = useExamTypeById(test.examTypeId);
  if (status === 'loading')
    return (
      <div className={cx('state-box')}>
        <Spinner animation="grow" variant="primary" />
        <h3>{t('loading')}</h3>
      </div>
    );

  if (status === 'ready') {
    const minutes = test.durationMinutes ?? 0;
    const timed = minutes > 0;
    const maxAttempts = test.maxAttempts ?? 0;
    const typeLabels = QUESTION_TYPE_ORDER.filter((qt) => questionTypes.includes(qt)).map((qt) =>
      t(`ready.questionTypes.${qt}`),
    );
    // Chỉ hiện các dòng đã có dữ liệu; điểm chuẩn và quy tắc tính điểm bổ sung khi backend trả về.
    const rows: { label: string; value: string }[] = [
      { label: t('ready.rows.questions'), value: t('ready.questionCountValue', { count: questionCount }) },
      ...(partCount > 1
        ? [{ label: t('ready.rows.parts'), value: t('ready.partCountValue', { count: partCount }) }]
        : []),
      {
        label: t('ready.rows.duration'),
        value: timed
          ? t('ready.durationValue', { minutes }) +
            (minutes >= 60
              ? ` ${t('ready.durationHours', { hours: Math.floor(minutes / 60), mins: minutes % 60 })}`
              : '')
          : t('ready.untimed'),
      },
      ...(typeLabels.length > 0
        ? [{ label: t('ready.rows.questionTypes'), value: typeLabels.join(' & ') }]
        : []),
      ...(maxAttempts > 0 && test.remainingAttempts != null
        ? [
            {
              label: t('ready.rows.attempts'),
              value: t('ready.attemptsValue', { remaining: test.remainingAttempts, max: maxAttempts }),
            },
          ]
        : []),
    ];

    return (
      <div className={cx('ready-wrap')}>
        <div className={cx('ready-card')}>
          <header className={cx('ready-header')}>
            <ExamTypeLogo examTypeId={test.examTypeId} />
            <div>
              <h1 className={cx('ready-title')}>
                {t('ready.guideTitle', { title: test.title || t('ready.fallbackTitle') })}
              </h1>
              {examType?.name && <p className={cx('ready-subtitle')}>{examType.name}</p>}
            </div>
          </header>

          <h2 className={cx('ready-section-title')}>{t('ready.readCarefully')}</h2>
          <dl className={cx('ready-table')}>
            {rows.map((row) => (
              <div key={row.label} className={cx('ready-row')}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>

          <h2 className={cx('ready-section-title')}>{t('ready.rulesTitle')}</h2>
          <ul className={cx('ready-rules')}>
            <li>{t('ready.autosave')}</li>
            <li>{t.rich('ready.submitHint', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
            {timed && <li>{t('ready.autoSubmit')}</li>}
            <li>{t('ready.noChangeAfterSubmit')}</li>
          </ul>

          <footer className={cx('ready-footer')}>
            <button type="button" className={cx('ready-cancel-btn')} onClick={onBack}>
              {t('ready.cancel')}
            </button>
            <button type="button" className={cx('ready-start-btn')} onClick={onStart}>
              {t('ready.start')}
            </button>
          </footer>
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
