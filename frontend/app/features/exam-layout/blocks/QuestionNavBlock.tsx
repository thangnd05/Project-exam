'use client';

import { List, X } from 'lucide-react';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from '@/app/features/exam-layout/TestStart.module.scss';
import { customBlockLabel } from '@/app/features/exam-layout/layoutSchema';

const cx = classNames.bind(styles);

type QuestionNavBlockProps = {
  /** Nằm trên thanh đầu tối (vùng TRÊN) thì dùng kiểu nút trên nền tối. */
  onDark?: boolean;
  open?: boolean;
  onToggle?: () => void;
  toggleLabel?: string;
  hideLabel?: string;
};

function QuestionNavBlock({ onDark, open, onToggle, toggleLabel, hideLabel }: QuestionNavBlockProps) {
  const t = useTranslations('TestTaking.examLayout');
  return (
    <ButtonPrime
      variant={onDark ? 'onDark' : open ? 'soft' : 'outline'}
      size="sm"
      shape="rounded"
      className={cx('btn-toggle-info')}
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? t('hideQuestionList') : t('showQuestionList')}
    >
      {open ? <X size={22} /> : <List size={22} />}
      <span>
        {open
          ? (customBlockLabel(hideLabel) ?? t('hide'))
          : (customBlockLabel(toggleLabel) ?? t('questions'))}
      </span>
    </ButtonPrime>
  );
}

export default QuestionNavBlock;
