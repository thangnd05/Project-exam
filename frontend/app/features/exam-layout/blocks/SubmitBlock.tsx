'use client';

import { Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from '@/app/features/exam-layout/TestStart.module.scss';
import { customBlockLabel } from '@/app/features/exam-layout/layoutSchema';

const cx = classNames.bind(styles);

type SubmitBlockProps = {
  onSubmit?: () => void;
  isSubmitting?: boolean;
  label?: string;
  /** exam: nút mực bo nhẹ của phòng thi; brand: nút chính viên thuốc (trang học lộ trình). */
  appearance?: 'exam' | 'brand';
};

function SubmitBlock({ onSubmit, isSubmitting, label, appearance = 'exam' }: SubmitBlockProps) {
  const t = useTranslations('TestTaking.examLayout');
  const exam = appearance === 'exam';
  return (
    <ButtonPrime
      variant={exam ? 'ink' : 'primary'}
      size={exam ? 'md' : 'lg'}
      shape={exam ? 'rounded' : 'pill'}
      className={cx('btn-submit')}
      onClick={onSubmit}
      disabled={isSubmitting}
    >
      {isSubmitting && <Spinner animation="border" size="sm" />}
      {isSubmitting ? t('submitting') : (customBlockLabel(label) ?? t('submit'))}
    </ButtonPrime>
  );
}

export default SubmitBlock;
