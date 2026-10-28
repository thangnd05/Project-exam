'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from '@/app/features/exam-layout/TestStart.module.scss';

const cx = classNames.bind(styles);

type FlagButtonProps = {
  flagged: boolean;
  onToggle: () => void;
};

// Đã đánh dấu thì nút chuyển sang nền xanh thương hiệu (brand), cùng màu góc gấp ở ô câu trong danh sách.
function FlagButton({ flagged, onToggle }: FlagButtonProps) {
  const t = useTranslations('TestTaking.examLayout');
  return (
    <ButtonPrime
      variant={flagged ? 'brand' : 'outline'}
      size="sm"
      shape="rounded"
      className={cx('flag-btn')}
      onClick={onToggle}
      aria-pressed={flagged}
      title={flagged ? t('unflag') : t('flagForReview')}
    >
      {flagged ? t('flagged') : t('flagForReview')}
    </ButtonPrime>
  );
}

export default FlagButton;
