'use client';
import {useMemo, useState} from 'react';

import {
  IoArrowForward,
  IoDocumentTextOutline,
  IoTimeOutline,
} from 'react-icons/io5';

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

const durationLabel = (minutes?: number) =>
  minutes != null && minutes > 0 ? `${minutes} phút` : 'Không giới hạn';

const questionLabel = (total?: number) =>
  total != null && total > 0 ? `${total} câu hỏi` : '- câu hỏi';

const displayTitle = (test: QuickChallengeCardResponse) =>
  test.examTypeName || test.title || 'Kiểm tra nhanh';

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
    <BaseModal show={show} onClose={onClose} title="Chọn đề kiểm tra nhanh" maxWidth={660}>
      {loading ? (
        <ul className={cx('list')} aria-busy="true" aria-label="Đang tải đề kiểm tra nhanh">
          {[0, 1].map((i) => (
            <li key={i} className={cx('skeleton')} />
          ))}
        </ul>
      ) : sortedTests.length === 0 ? (
        <p className={cx('status')}>Chưa có đề kiểm tra nhanh trên website.</p>
      ) : (
        <>
          <p className={cx('intro')}>
            <strong>{sortedTests.length} đề</strong> sẵn sàng, làm ngay để biết bạn đang ở đâu.
          </p>
          <ul className={cx('list')}>
            {sortedTests.map((test) => {
              const subtitle = displaySubtitle(test);
              const name = displayTitle(test);
              return (
                <li key={test.testId}>
                  <button
                    type="button"
                    className={cx('item')}
                    onClick={() => onSelect?.(test)}
                    aria-label={`Bắt đầu ${name}`}
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
                      Bắt đầu
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
