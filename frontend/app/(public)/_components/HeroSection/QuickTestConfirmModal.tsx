'use client';
import {
  IoArrowForward,
  IoDocumentTextOutline,
  IoLeafOutline,
  IoPlayOutline,
  IoTimeOutline,
  IoTrendingUpOutline,
} from 'react-icons/io5';
import classNames from 'classnames/bind';

import BaseModal from '@/app/components/modal/BaseModal';
import type {QuickChallengeCardResponse} from '@/app/types/test';
import {setLearnerLevel} from '@/app/utils/learnerLevel';
import styles from './QuickTestConfirmModal.module.scss';

const cx = classNames.bind(styles);

function shortExamName(name?: string): string {
  if (!name) return 'Kiểm tra nhanh';
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
  if (!test) return null;

  const durationLabel =
    test.durationMinutes != null && test.durationMinutes > 0
      ? `${test.durationMinutes} phút`
      : 'Không giới hạn';

  const questionLabel =
    test.totalQuestions != null
      ? `${test.totalQuestions} câu hỏi`
      : '- câu hỏi';

  const examName = shortExamName(test.examTypeName || test.title);

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
      title={`Bắt đầu với ${examName}`}
      maxWidth={560}
    >
      <div className={cx('body')}>
        {test.examTypeImageUrl ? (
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
              <span className={cx('optionTitle')}>Làm bài thi thử ngay</span>
              <span className={cx('optionHint')}>
                {isGuest
                  ? 'Không cần đăng nhập, làm xong biết ngay đang yếu phần nào.'
                  : 'Làm xong biết ngay đang yếu phần nào.'}
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
                  ? 'Đăng nhập để xây lộ trình cá nhân hóa'
                  : 'Xây lộ trình cá nhân hóa'}
              </span>
              <span className={cx('optionHint')}>
                Đặt mục tiêu và nhận lộ trình ôn tập riêng, tiến độ lưu vào tài khoản.
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
