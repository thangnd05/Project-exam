'use client';
import {useEffect, useState} from 'react';
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
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import type {QuickChallengeCardResponse} from '@/app/types/test';
import {setLearnerLevel} from '@/app/utils/learnerLevel';
import styles from './QuickTestConfirmModal.module.scss';

const cx = classNames.bind(styles);

function shortExamName(name?: string): string {
  if (!name) return 'Kiểm tra nhanh';
  return name.length > 64 ? `${name.slice(0, 61)}…` : name;
}

type Step = 'ask' | 'beginner';

type QuickTestConfirmModalProps = {
  show: boolean;
  test: QuickChallengeCardResponse | null;
  onClose?: () => void;
  onConfirm?: (test: QuickChallengeCardResponse) => void;
  onExploreExam?: (test: QuickChallengeCardResponse) => void;
  onStartSyllabusPlan?: (test: QuickChallengeCardResponse) => void;
};

function QuickTestConfirmModal({
  show,
  test,
  onClose,
  onConfirm,
  onExploreExam,
  onStartSyllabusPlan,
}: QuickTestConfirmModalProps) {
  const [step, setStep] = useState<Step>('ask');

  useEffect(() => {
    if (show) setStep('ask');
  }, [show, test?.testId]);

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
    setStep('beginner');
  };

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={
        step === 'ask' ? `Bắt đầu với ${examName}?` : 'Bắt đầu từ nền tảng'
      }
      maxWidth={560}
      footer={
        step === 'beginner' ? (
          <ModalActionFooter
            cancelLabel="Quay lại"
            submitLabel="Tạo lộ trình học từ đầu"
            submitIcon={IoArrowForward}
            onCancel={() => setStep('ask')}
            onSubmit={() => onStartSyllabusPlan?.(test)}
          />
        ) : undefined
      }
    >
      {step === 'ask' ? (
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
                <span className={cx('optionTitle')}>
                  Mình đã học kỳ thi này
                </span>
                <span className={cx('optionHint')}>
                  Làm bài kiểm tra nhanh để biết đang yếu phần nào.
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
                <span className={cx('optionTitle')}>Mình chưa học gì</span>
                <span className={cx('optionHint')}>
                  Xem nên bắt đầu từ đâu trước khi làm bài.
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
      ) : (
        <div className={cx('panel')}>
          <p className={cx('panelLead')}>
            Bài kiểm tra nhanh chấm theo số câu đúng. Khi chưa học, kết quả sẽ
            rất thấp và không cho biết bạn yếu chỗ nào — chỉ cho biết bạn chưa
            học.
          </p>
          <p className={cx('panelLead')}>
            WinDe sẽ dựng lộ trình đi theo chương trình của{' '}
            <strong>{examName}</strong>: từng phần thi, từng chủ điểm, học tới
            đâu luyện tới đó. Làm bài nhanh sau, khi đã quen dạng đề, thì kết
            quả mới có ích.
          </p>
          <div className={cx('panelLinks')}>
            <button
              type="button"
              className={cx('linkBtn')}
              onClick={() => onExploreExam?.(test)}
            >
              Xem cấu trúc kỳ thi trước
            </button>
            <button
              type="button"
              className={cx('linkBtn')}
              onClick={() => onConfirm?.(test)}
            >
              Vẫn muốn thử bài nhanh ngay
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}

export default QuickTestConfirmModal;
