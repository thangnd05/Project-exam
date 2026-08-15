'use client';

import { Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';

// Các block dùng chung class của trang làm bài nên vẫn đọc scss ở features/tests (giữ nguyên giao diện).
import styles from '@/app/features/tests/exam/exam-types/detail/testStart/TestStartPage.module.scss';

const cx = classNames.bind(styles);

type SubmitBlockProps = {
  onSubmit?: () => void;
  isSubmitting?: boolean;
  label?: string;
};

function SubmitBlock({ onSubmit, isSubmitting, label = 'Nộp bài thi' }: SubmitBlockProps) {
  return (
    <button
      type="button"
      className={cx('btn-submit')}
      onClick={onSubmit}
      disabled={isSubmitting}
    >
      {isSubmitting && <Spinner animation="border" size="sm" />}
      {isSubmitting ? 'Đang nộp bài...' : label}
    </button>
  );
}

export default SubmitBlock;
