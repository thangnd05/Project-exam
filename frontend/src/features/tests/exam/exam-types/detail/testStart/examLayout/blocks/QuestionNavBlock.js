'use client';

import { IoListOutline, IoCloseOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';

import styles from '../../TestStartPage.module.scss';

const cx = classNames.bind(styles);

function QuestionNavBlock({ open, onToggle, toggleLabel = 'Câu hỏi', hideLabel = 'Ẩn' }) {
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
