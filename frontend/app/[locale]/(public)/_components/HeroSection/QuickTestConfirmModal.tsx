'use client';
import {
  IoArrowForward,
  IoDocumentTextOutline,
  IoLeafOutline,
  IoPlayOutline,
  IoTimeOutline,
  IoTrendingUpOutline,
} from 'react-icons/io5';
import {useTranslations} from 'next-intl';
import classNames from 'classnames/bind';

import BaseModal from '@/app/components/modal/BaseModal';
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

  if (!test) return null;

  const durationLabel =
    test.durationMinutes != null && test.durationMinutes > 0
      ? t('minutes', {minutes: test.durationMinutes})
      : t('unlimited');

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
      title={t('confirm.title', {name: examName})}
      maxWidth={560}
    >
      <div className={cx('body')}>
        {test.examTypeImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo do admin dán (URL ngoài tuỳ ý), không qua next/image
          <img
            className={cx('logo')}
            src={test.examTypeImageUrl}
            alt=""
            aria-hidden="true"
          />
        ) : null}

        <p className={cx('examName')}>{examName}</p>

        <div className={cx('options')}>
          <button
            type="button"
            className={cx('option')}
            onClick={chooseStudied}
          >
            <span className={cx('optionIcon')}>
              <IoTrendingUpOutline aria-hidden="true" />
            </span>
            <span className={cx('optionText')}>
              <span className={cx('optionTitle')}>{t('confirm.practiceTitle')}</span>
              <span className={cx('optionHint')}>
                {isGuest
                  ? t('confirm.practiceHintGuest')
                  : t('confirm.practiceHint')}
              </span>
            </span>
            <IoPlayOutline className={cx('optionArrow')} aria-hidden="true" />
          </button>

          <button
            type="button"
            className={cx('option')}
            onClick={chooseBeginner}
          >
            <span className={cx('optionIcon', 'optionIconSoft')}>
              <IoLeafOutline aria-hidden="true" />
            </span>
            <span className={cx('optionText')}>
              <span className={cx('optionTitle')}>
                {isGuest
                  ? t('confirm.planTitleGuest')
                  : t('confirm.planTitle')}
              </span>
              <span className={cx('optionHint')}>
                {t('confirm.planHint')}
              </span>
            </span>
            <IoArrowForward
              className={cx('optionArrow')}
              aria-hidden="true"
            />
          </button>
        </div>

        <ul className={cx('meta')}>
          <li>
            <IoDocumentTextOutline aria-hidden="true" />
            <span>{questionLabel}</span>
          </li>
          <li>
            <IoTimeOutline aria-hidden="true" />
            <span>{durationLabel}</span>
          </li>
        </ul>
      </div>
    </BaseModal>
  );
}

export default QuickTestConfirmModal;
