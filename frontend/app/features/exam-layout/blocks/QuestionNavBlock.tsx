'use client';

import { List, X } from 'lucide-react';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';

import styles from '@/app/features/exam-layout/TestStart.module.scss';
import { customBlockLabel } from '@/app/features/exam-layout/layoutSchema';

const cx = classNames.bind(styles);

type QuestionNavBlockProps = {
  open?: boolean;
  onToggle?: () => void;
  toggleLabel?: string;
  hideLabel?: string;
};

function QuestionNavBlock({ open, onToggle, toggleLabel, hideLabel }: QuestionNavBlockProps) {
  const t = useTranslations('TestTaking.examLayout');
  return (
    <button
      type="button"
      className={cx('btn-toggle-info', { active: open })}
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
    </button>
  );
}

export default QuestionNavBlock;
