'use client';

import Link from '@/app/i18n/navigation';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { listPlans } from '@/app/apis/learningPlanApi';
import { useAuth } from '@/app/hooks/useAuth';
import { withExam } from '@/app/features/exam-types/hooks/useExamParam';
import type { ExamTypeResponse } from '@/app/types/exam-type';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

const TABS = [
  { key: 'target', path: '/my-target' },
  { key: 'plan', path: '/learning-plans/generate' },
  { key: 'compare', path: '/learning-plans/compare' },
  { key: 'overview', path: '/my-target/dashboard' },
] as const;

type TargetPlanTabsProps = {
  active?: 'target' | 'plan' | 'compare' | 'overview';
  examTypeId?: string | null;
  /** Danh sách kỳ thi của trang, để link tab mang slug (?exam=saa-c03) thay vì id. */
  examTypes?: readonly ExamTypeResponse[];
};

function TargetPlanTabs({ active, examTypeId, examTypes }: TargetPlanTabsProps) {
  const t = useTranslations('MyTarget');
  const { isAuthenticated } = useAuth();

  // Chưa có ít nhất 2 lộ trình thì chưa có gì để so sánh, ẩn tab cho đỡ rối.
  const { data: planCount = 0 } = useQuery({
    queryKey: ['learning-plan-count', examTypeId || null],
    queryFn: () => listPlans(examTypeId || undefined).then((plans) => plans?.length ?? 0),
    staleTime: 0,
    enabled: isAuthenticated,
  });
  const tabs = TABS.filter(
    (tab) => tab.key !== 'compare' || active === 'compare' || planCount >= 2,
  );

  return (
    <nav className={cx('pageTabs')} aria-label={t('tabs.ariaLabel')}>
      {tabs.map((tab) => (
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
