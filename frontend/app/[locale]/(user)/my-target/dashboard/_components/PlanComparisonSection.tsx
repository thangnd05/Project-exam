'use client';

import Link from '@/app/i18n/navigation';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import dynamic from 'next/dynamic';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { formatDateTime } from '@/app/utils/format-date-time';
import { planStageLabel, planStatusLabel, planStatusVariant } from '@/app/features/learning-plans/planLabels';
import { LearningPlanStatus } from '@/app/enums';
import type { PlanResponse } from '@/app/types';
import planStyles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import pageStyles from './PlanComparison.module.scss';
import { MIN_PLANS_TO_COMPARE, PLAN_COMPARE_ANCHOR } from '@/app/features/learning-plans/planCompare';

const cx = classNames.bind(planStyles);
const ui = classNames.bind(uiStyles);
const pageCx = classNames.bind(pageStyles);

const PlanComparisonCharts = dynamic(() => import('./PlanComparisonCharts'), { ssr: false });

type PlanComparisonSectionProps = {
  plans: PlanResponse[];
  examTypeName: string;
};

// So sánh các lộ trình của kỳ thi đang chọn ở Tổng quan; chỉ hiện khi có từ 2 lộ trình.
function PlanComparisonSection({ plans, examTypeName }: PlanComparisonSectionProps) {
  const t = useTranslations('LearningPlans');
  const sectionRef = useRef<HTMLElement>(null);

  const sorted = useMemo(
    () => [...plans].sort((a, b) => (a.planSequence ?? 0) - (b.planSequence ?? 0)),
    [plans],
  );

  const chartData = useMemo(() => {
    // Lộ trình sinh theo chương trình học không có readiness ban đầu nên không so sánh được.
    const diagnosed = sorted.filter((p) => p.baselineReadiness != null);
    return diagnosed.map((p, idx) => {
      const prev = idx > 0 ? diagnosed[idx - 1] : null;
      const readiness = p.baselineReadiness as number;
      const prevReadiness = prev ? prev.baselineReadiness ?? null : null;
      return {
        key: p.learningPlanId,
        label: t('common.planName', { sequence: p.planSequence ?? '?' }),
        readiness,
        status: p.status,
        planStage: p.planStage,
        createdAt: formatDateTime(p.createdAt),
        diffVsPrev: prevReadiness != null ? readiness - prevReadiness : null,
      };
    });
  }, [sorted, t]);

  const visible = sorted.length >= MIN_PLANS_TO_COMPARE;

  // Section hiện sau khi dữ liệu tải xong nên trình duyệt chưa kịp cuộn theo #plan-compare; cuộn tay một lần.
  useEffect(() => {
    if (visible && window.location.hash === `#${PLAN_COMPARE_ANCHOR}`) {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <section ref={sectionRef} id={PLAN_COMPARE_ANCHOR} aria-labelledby="overview-compare-title">
      <div className={ui('cardHead')}>
        <h3 id="overview-compare-title" className={ui('cardTitle')}>
          {t('compare.title')}
        </h3>
      </div>

      <PlanComparisonCharts chartData={chartData} examTypeName={examTypeName} />

      <div className={cx('timelineGrid')}>
        {sorted.map((p, idx) => {
          const prev = idx > 0 ? sorted[idx - 1] : null;
          const cur = p.baselineReadiness ?? null;
          const prevReadiness = prev ? (prev.baselineReadiness ?? null) : null;
          const diff = prevReadiness != null && cur != null ? cur - prevReadiness : null;

          return (
            <div
              key={p.learningPlanId}
              className={cx('planCard', {
                active: p.status === LearningPlanStatus.ACTIVE,
                completed: p.status === LearningPlanStatus.COMPLETED,
              })}
            >
              <div className={cx('planHead')}>
                <span className={cx('planNo')}>{t('common.planName', { sequence: p.planSequence ?? '?' })}</span>
                <span className={cx('badge', planStatusVariant(p.status))}>{planStatusLabel(t, p.status)}</span>
              </div>

              <ul className={cx('metaList')}>
                <li>
                  <strong>{t('common.baselineReadiness')}</strong>
                  {cur != null ? ` ${cur}%` : ' '}
                  {diff != null && (
                    <span className={cx('statDelta', { up: diff > 0, down: diff < 0, flat: diff === 0 })}>
                      {t('compare.diffVsPrev', {
                        diff: `${diff > 0 ? '+' : ''}${diff}`,
                        sequence: prev?.planSequence ?? '',
                      })}
                    </span>
                  )}
                </li>
                <li><strong>{t('common.stage')}</strong> {planStageLabel(t, p.planStage)}</li>
                <li>
                  <strong>{t('compare.tasksPassed')}</strong>{' '}
                  {p.passedTasks ?? 0}/{p.totalTasks ?? 0}
                </li>
                <li>
                  <strong>{t('compare.sourceTest')}</strong>{' '}
                  {p.sourceUserTestId ? (
                    <Link href={`/tests/result/${p.sourceUserTestId}`}>{t('compare.viewResult')}</Link>
                  ) : '-'}
                </li>
                <li className={cx('muted')}>{t('compare.createdAt', { date: formatDateTime(p.createdAt) })}</li>
                {p.replacedByPlanId && (
                  <li>
                    <Link href={`/learning-plans/${p.replacedByPlanId}`}>{t('compare.replacedBy')}</Link>
                  </li>
                )}
              </ul>

              <div className={pageCx('planCardActions')}>
                <ButtonPrime as="link" href={`/learning-plans/${p.learningPlanId}`} variant="outline" size="sm">
                  {t('compare.details')}
                </ButtonPrime>
                {p.status === LearningPlanStatus.ACTIVE && (
                  <ButtonPrime
                    as="link"
                    href={`/learning-plans/${p.learningPlanId}/study`}
                    variant="primary"
                    size="sm"
                  >
                    {t('compare.continue')}
                  </ButtonPrime>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default PlanComparisonSection;
