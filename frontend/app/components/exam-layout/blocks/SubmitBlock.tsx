'use client';

import { Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';

// Các block dùng chung class của trang làm bài; scss đặt cạnh engine để bớt import chéo.
import styles from '@/app/components/exam-layout/TestStart.module.scss';

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
