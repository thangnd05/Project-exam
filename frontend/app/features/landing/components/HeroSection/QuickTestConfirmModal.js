'use client';

import classNames from 'classnames/bind';
import {IoPlayOutline, IoTimeOutline, IoDocumentTextOutline} from 'react-icons/io5';

import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import styles from './QuickTestConfirmModal.module.scss';

const cx = classNames.bind(styles);

function shortExamName(name) {
  if (!name) return 'Kiểm tra nhanh';
  return name.length > 64 ? `${name.slice(0, 61)}…` : name;
}

function QuickTestConfirmModal({show, test, onClose, onConfirm}) {
  if (!test) return null;

  const durationLabel =
    test.durationMinutes != null && test.durationMinutes > 0
      ? `${test.durationMinutes} phút`
      : 'Không giới hạn';

  const questionLabel =
    test.totalQuestions != null ? `${test.totalQuestions} câu hỏi` : '— câu hỏi';

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title="Sẵn sàng kiểm tra nhanh?"
      maxWidth={560}
      footer={
        <ModalActionFooter
          cancelLabel="Để sau"
          submitLabel="Bắt đầu"
          submitIcon={IoPlayOutline}
          onCancel={onClose}
          onSubmit={() => onConfirm?.(test)}
        />
      }
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

        <p className={cx('examName')}>{shortExamName(test.examTypeName || test.title)}</p>
        <p className={cx('hint')}>Bài ngắn để lộ điểm yếu bạn có thể bắt đầu ngay.</p>

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
