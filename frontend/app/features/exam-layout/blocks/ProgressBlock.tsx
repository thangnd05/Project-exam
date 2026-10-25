'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';

import styles from '@/app/features/exam-layout/TestStart.module.scss';

const cx = classNames.bind(styles);

type ProgressBlockProps = {
  answered: number;
  total: number;
};

function ProgressBlock({ answered, total }: ProgressBlockProps) {
  const t = useTranslations('TestTaking.examLayout');
  return (
    <div className={cx('exam-stat', 'exam-stat-done')}>
      <span className={cx('exam-stat-label')}>{t('progressLabel')}</span>
      <span className={cx('exam-stat-value')}>
        {answered}/{total}
      </span>
    </div>
  );
}

export default ProgressBlock;
