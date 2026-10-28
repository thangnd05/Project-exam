'use client';

import Link from '@/app/i18n/navigation';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import routes from '@/app/configs/Routes';
import { goalHref, withExam } from '@/app/features/exam-types/hooks/useExamParam';
import type { ExamTypeResponse } from '@/app/types/exam-type';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

const TABS = [
  { key: 'target', path: routes.myTarget },
  { key: 'plan', path: routes.generatePlan },
  { key: 'overview', path: routes.targetDashboard },
  { key: 'compare', path: routes.planCompare },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// Tổng quan mang kỳ thi trên path (/dashboard/goals/aws-saa-c03), các tab khác trên query (?exam=saa-c03).
const tabHref = (
  key: TabKey,
  path: string,
  examTypeId: string | null | undefined,
  examTypes: readonly ExamTypeResponse[] = [],
) => (key === 'overview' ? goalHref(examTypeId, examTypes) : withExam(path, examTypeId, examTypes));

type TargetPlanTabsProps = {
  active?: TabKey;
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
          href={tabHref(tab.key, tab.path, examTypeId, examTypes)}
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
