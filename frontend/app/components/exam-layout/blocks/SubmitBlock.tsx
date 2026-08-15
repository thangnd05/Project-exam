'use client';

import { Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';

import styles from '../../TestStartPage.module.scss';

const cx = classNames.bind(styles);

function SubmitBlock({ onSubmit, isSubmitting, label = 'Nộp bài thi' }) {
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
