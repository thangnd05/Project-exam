'use client';
import {IoArrowForward, IoLeafOutline} from 'react-icons/io5';
import {useTranslations} from 'next-intl';
import classNames from 'classnames/bind';

import BaseModal from '@/app/components/modal/BaseModal';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import type {QuickChallengeCardResponse} from '@/app/types/test';
import {setLearnerLevel} from '@/app/features/learning-plans/learnerLevel';
import styles from './QuickTestConfirmModal.module.scss';

const cx = classNames.bind(styles);

function shortExamName(name: string | undefined, fallback: string): string {
  if (!name) return fallback;
  return name.length > 64 ? `${name.slice(0, 61)}…` : name;
}

type QuickTestConfirmModalProps = {
  show: boolean;
  test: QuickChallengeCardResponse | null;
  onClose?: () => void;
  onConfirm?: (test: QuickChallengeCardResponse) => void;
  onStartSyllabusPlan?: (test: QuickChallengeCardResponse) => void;
  isGuest?: boolean;
};

function QuickTestConfirmModal({
  show,
  test,
  onClose,
  onConfirm,
  onStartSyllabusPlan,
  isGuest = false,
}: QuickTestConfirmModalProps) {
  const t = useTranslations('Home.quickTest');
  const tCommon = useTranslations('Common');

  if (!test) return null;

  const hasDuration = test.durationMinutes != null && test.durationMinutes > 0;

  const questionLabel =
    test.totalQuestions != null
      ? t('questions', {count: test.totalQuestions})
      : t('questionsUnknown');

  const examName = shortExamName(test.examTypeName || test.title, t('fallbackName'));

  const chooseStudied = () => {
    setLearnerLevel(test.examTypeId, 'STUDIED');
    onConfirm?.(test);
  };

  const chooseBeginner = () => {
    setLearnerLevel(test.examTypeId, 'BEGINNER');
    onStartSyllabusPlan?.(test);
  };

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={t('confirm.title')}
      maxWidth={600}
      variant="plain"
      footer={
        <>
          <ButtonPrime
            variant="outline"
            size="lg"
            className={cx('footerBtn')}
            onClick={onClose}
          >
            {tCommon('cancelShort')}
          </ButtonPrime>
          <ButtonPrime
            variant="primary"
            size="lg"
            className={cx('footerBtn')}
            onClick={chooseStudied}
          >
            {t('confirm.start')}
          </ButtonPrime>
        </>
      }
    >
      <div className={cx('body')}>
        <p className={cx('intro')}>
          {hasDuration
            ? t.rich('confirm.intro', {
                questions: questionLabel,
                duration: t('minutes', {minutes: test.durationMinutes ?? 0}),
                strong: (chunks) => <strong>{chunks}</strong>,
              })
            : t.rich('confirm.introNoLimit', {
                questions: questionLabel,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
        </p>

        <div className={cx('perk')}>
          <p className={cx('perkTitle')}>{t('confirm.perkTitle')}</p>
          <p className={cx('perkText')}>
            {isGuest ? t('confirm.perkTextGuest') : t('confirm.perkText')}
          </p>
        </div>

        <div className={cx('field')}>
          <span className={cx('fieldLabel')}>{t('confirm.examLabel')}</span>
          <div className={cx('exam')}>
            {test.examTypeImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo do admin dán (URL ngoài tuỳ ý), không qua next/image
              <img
                className={cx('logo')}
                src={test.examTypeImageUrl}
                alt=""
                aria-hidden="true"
              />
            ) : null}
            <span className={cx('examName')}>{examName}</span>
          </div>
        </div>

        <button
          type="button"
          className={cx('planLink')}
          onClick={chooseBeginner}
          title={t('confirm.planHint')}
        >
          <IoLeafOutline className={cx('planIcon')} aria-hidden="true" />
          <span>
            <span className={cx('planPrompt')}>{t('confirm.planPrompt')}</span>{' '}
            <span className={cx('planTitle')}>
              {isGuest ? t('confirm.planTitleGuest') : t('confirm.planTitle')}
            </span>
          </span>
          <IoArrowForward className={cx('planArrow')} aria-hidden="true" />
        </button>
      </div>
    </BaseModal>
  );
}

export default QuickTestConfirmModal;
