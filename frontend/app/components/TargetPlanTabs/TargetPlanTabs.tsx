'use client';

import Link from 'next/link';
import classNames from 'classnames/bind';
import { useQuery } from '@tanstack/react-query';
import { listPlans } from '@/app/apis/learningPlanApi';
import { useAuth } from '@/app/hooks/useAuth';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

const TABS = [
  { key: 'target', label: 'Mục tiêu', path: '/my-target' },
  { key: 'plan', label: 'Lập lộ trình', path: '/learning-plans/generate' },
  { key: 'compare', label: 'So sánh lộ trình', path: '/learning-plans/compare' },
  { key: 'overview', label: 'Tổng quan', path: '/my-target/dashboard' },
];

type TargetPlanTabsProps = {
  active?: 'target' | 'plan' | 'compare' | 'overview';
  examTypeId?: string | null;
};

function TargetPlanTabs({ active, examTypeId }: TargetPlanTabsProps) {
  const qs = examTypeId ? `?examTypeId=${encodeURIComponent(examTypeId)}` : '';
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
    <nav className={cx('pageTabs')} aria-label="Mục tiêu và lộ trình học">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`${tab.path}${qs}`}
          className={cx('pageTab', { active: tab.key === active })}
          aria-current={tab.key === active ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export default TargetPlanTabs;
