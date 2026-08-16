'use client';

import { IoListOutline, IoCloseOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';

import styles from '@/app/components/exam-layout/TestStart.module.scss';

const cx = classNames.bind(styles);

type QuestionNavBlockProps = {
  open?: boolean;
  onToggle?: () => void;
  toggleLabel?: string;
  hideLabel?: string;
};

function QuestionNavBlock({ open, onToggle, toggleLabel = 'Câu hỏi', hideLabel = 'Ẩn' }: QuestionNavBlockProps) {
  return (
    <button
      type="button"
      className={cx('btn-toggle-info', { active: open })}
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? 'Ẩn danh sách câu hỏi' : 'Xem danh sách câu hỏi'}
    >
      {open ? <IoCloseOutline size={22} /> : <IoListOutline size={22} />}
      <span>{open ? hideLabel : toggleLabel}</span>
    </button>
  );
}

export default QuestionNavBlock;
