'use client';

import Link from '@/app/i18n/navigation';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { withExam } from '@/app/features/exam-types/hooks/useExamParam';
import type { ExamTypeResponse } from '@/app/types/exam-type';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

// So sánh lộ trình là một mục trong Tổng quan, không phải tab riêng.
const TABS = [
  { key: 'target', path: '/my-target' },
  { key: 'plan', path: '/learning-plans/generate' },
  { key: 'overview', path: '/my-target/dashboard' },
] as const;

type TargetPlanTabsProps = {
  active?: 'target' | 'plan' | 'overview';
  examTypeId?: string | null;
  /** Danh sách kỳ thi của trang, để link tab mang slug (?exam=saa-c03) thay vì id. */
  examTypes?: readonly ExamTypeResponse[];
};

function TargetPlanTabs({ active, examTypeId, examTypes }: TargetPlanTabsProps) {
  const t = useTranslations('MyTarget');

  return (
    <nav className={cx('pageTabs')} aria-label={t('tabs.ariaLabel')}>
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={withExam(tab.path, examTypeId, examTypes)}
          className={cx('pageTab', { active: tab.key === active })}
          aria-current={tab.key === active ? 'page' : undefined}
        >
          {t(`tabs.${tab.key}`)}
        </Link>
      ))}
    </nav>
  );
}

export default TargetPlanTabs;
