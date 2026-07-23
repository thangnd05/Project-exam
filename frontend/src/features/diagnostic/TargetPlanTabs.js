import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

const TABS = [
  { key: 'target', label: 'Mục tiêu', path: '/my-target' },
  { key: 'plan', label: 'Lập kế hoạch', path: '/learning-plans/generate' },
  { key: 'compare', label: 'So sánh lộ trình', path: '/learning-plans/compare' },
  { key: 'overview', label: 'Tổng quan', path: '/my-target/dashboard' },
];

/**
 * Thanh tab gộp khu "Mục tiêu" + "Lập kế hoạch" thành 1 trải nghiệm.
 * Vẫn giữ 2 route riêng (không vỡ link cũ) — tab chỉ là điều hướng, giữ examTypeId.
 */
function TargetPlanTabs({ active, examTypeId }) {
  const qs = examTypeId ? `?examTypeId=${encodeURIComponent(examTypeId)}` : '';
  return (
    <nav className={cx('pageTabs')} aria-label="Mục tiêu và kế hoạch học">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          to={`${tab.path}${qs}`}
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
