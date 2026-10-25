'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';

import styles from '@/app/features/exam-layout/TestStart.module.scss';

const cx = classNames.bind(styles);

type FlagButtonProps = {
  flagged: boolean;
  onToggle: () => void;
};

// Ô vuông có góc gấp cam giống ô "Đánh dấu" trong danh sách câu, để người làm bài nhận ra ngay hai chỗ là một.
function FlagButton({ flagged, onToggle }: FlagButtonProps) {
  const t = useTranslations('TestTaking.examLayout');
  return (
    <button
      type="button"
      className={cx('flag-btn', { active: flagged })}
      onClick={onToggle}
      aria-pressed={flagged}
      title={flagged ? t('unflag') : t('flagForReview')}
    >
      <span className={cx('flag-swatch')} aria-hidden />
      <span>{flagged ? t('flagged') : t('flagForReview')}</span>
    </button>
  );
}

export default FlagButton;
