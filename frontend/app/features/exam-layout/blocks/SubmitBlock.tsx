'use client';

import { Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';

import styles from '@/app/features/exam-layout/TestStart.module.scss';
import { customBlockLabel } from '@/app/features/exam-layout/layoutSchema';

const cx = classNames.bind(styles);

type SubmitBlockProps = {
  onSubmit?: () => void;
  isSubmitting?: boolean;
  label?: string;
};

function SubmitBlock({ onSubmit, isSubmitting, label }: SubmitBlockProps) {
  const t = useTranslations('TestTaking.examLayout');
  return (
    <button
      type="button"
      className={cx('btn-submit')}
      onClick={onSubmit}
      disabled={isSubmitting}
    >
      {isSubmitting && <Spinner animation="border" size="sm" />}
      {isSubmitting ? t('submitting') : (customBlockLabel(label) ?? t('submit'))}
    </button>
  );
}

export default SubmitBlock;
