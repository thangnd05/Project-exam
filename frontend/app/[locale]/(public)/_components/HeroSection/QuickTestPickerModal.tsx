'use client';
import {useMemo, useState} from 'react';

import {
  IoArrowForward,
  IoDocumentTextOutline,
  IoTimeOutline,
} from 'react-icons/io5';

import {useTranslations} from 'next-intl';
import classNames from 'classnames/bind';

import BaseModal from '@/app/components/modal/BaseModal';
import type {QuickChallengeCardResponse} from '@/app/types/test';

import styles from './QuickTestPickerModal.module.scss';

const cx = classNames.bind(styles);

const getInitials = (name?: string) => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const displayTitle = (test: QuickChallengeCardResponse, fallback: string) =>
  test.examTypeName || test.title || fallback;

const displaySubtitle = (test: QuickChallengeCardResponse) => {
  const title = test.title?.trim();
  const exam = test.examTypeName?.trim();
  if (title && exam && title !== exam) return title;
  return null;
};

type LogoProps = {
  url?: string;
  name?: string;
};

function Logo({url, name}: LogoProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(url) && !failed;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logo do admin dán (URL ngoài tuỳ ý) kèm onError fallback
      <img
        className={cx('logo')}
        src={url}
        alt=""
        aria-hidden="true"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={cx('initials')} aria-hidden="true">
      {getInitials(name)}
    </span>
  );
}

type QuickTestPickerModalProps = {
  show: boolean;
  tests: QuickChallengeCardResponse[];
  loading?: boolean;
  onClose?: () => void;
  onSelect?: (test: QuickChallengeCardResponse) => void;
};

function QuickTestPickerModal({
  show,
  tests,
  loading = false,
  onClose,
  onSelect,
}: QuickTestPickerModalProps) {
  const t = useTranslations('Home.quickTest');

  const durationLabel = (minutes?: number) =>
    minutes != null && minutes > 0 ? t('minutes', {minutes}) : t('unlimited');

  const questionLabel = (total?: number) =>
    total != null && total > 0 ? t('questions', {count: total}) : t('questionsUnknown');

  const sortedTests = useMemo(
    () =>
      [...tests].sort((a, b) => {
        const byExam = (a.examTypeName || '').localeCompare(b.examTypeName || '', 'vi');
        if (byExam !== 0) return byExam;
        return (a.title || '').localeCompare(b.title || '', 'vi');
      }),
    [tests],
  );

  return (
    <BaseModal show={show} onClose={onClose} title={t('picker.title')} maxWidth={660}>
      {loading ? (
        <ul className={cx('list')} aria-busy="true" aria-label={t('picker.loadingAria')}>
          {[0, 1].map((i) => (
            <li key={i} className={cx('skeleton')} />
          ))}
        </ul>
      ) : sortedTests.length === 0 ? (
        <p className={cx('status')}>{t('picker.empty')}</p>
      ) : (
        <>
          <p className={cx('intro')}>
            {t.rich('picker.intro', {
              count: sortedTests.length,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          <ul className={cx('list')}>
            {sortedTests.map((test) => {
              const subtitle = displaySubtitle(test);
              const name = displayTitle(test, t('fallbackName'));
              return (
                <li key={test.testId}>
                  <button
                    type="button"
                    className={cx('item')}
                    onClick={() => onSelect?.(test)}
                    aria-label={t('picker.startAria', {name})}
                  >
                    <span className={cx('logoFrame')}>
                      <Logo url={test.examTypeImageUrl || test.bannerUrl} name={name} />
                    </span>
                    <span className={cx('info')}>
                      <span className={cx('name')}>{name}</span>
                      {subtitle ? <span className={cx('subtitle')}>{subtitle}</span> : null}
                      <span className={cx('meta')}>
                        <span className={cx('chip')}>
                          <IoDocumentTextOutline aria-hidden="true" />
                          {questionLabel(test.totalQuestions)}
                        </span>
                        <span className={cx('chip')}>
                          <IoTimeOutline aria-hidden="true" />
                          {durationLabel(test.durationMinutes)}
                        </span>
                      </span>
                    </span>
                    <span className={cx('start')}>
                      {t('picker.start')}
                      <IoArrowForward className={cx('startArrow')} aria-hidden="true" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </BaseModal>
  );
}

export default QuickTestPickerModal;
