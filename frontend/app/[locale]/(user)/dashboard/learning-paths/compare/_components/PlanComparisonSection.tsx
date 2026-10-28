'use client';

import Link from '@/app/i18n/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import dynamic from 'next/dynamic';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { formatDateTime } from '@/app/utils/format-date-time';
import { planStageLabel, planStatusLabel, planStatusVariant } from '@/app/features/learning-plans/planLabels';
import { LearningPlanStatus } from '@/app/enums';
import type { PlanResponse } from '@/app/types';
import planStyles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import pageStyles from './PlanComparison.module.scss';
import { MIN_PLANS_TO_COMPARE } from '@/app/features/learning-plans/planCompare';

const cx = classNames.bind(planStyles);
const pageCx = classNames.bind(pageStyles);

const PlanComparisonCharts = dynamic(() => import('./PlanComparisonCharts'), { ssr: false });

type PlanComparisonSectionProps = {
  plans: PlanResponse[];
  examTypeName: string;
};

// So sánh các lộ trình của kỳ thi đang chọn; chỉ hiện khi có từ 2 lộ trình.
function PlanComparisonSection({ plans, examTypeName }: PlanComparisonSectionProps) {
  const t = useTranslations('LearningPlans');

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

  if (sorted.length < MIN_PLANS_TO_COMPARE) return null;

  return (
    <section aria-label={t('compare.title')}>
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
                    <Link href={`/attempts/${p.sourceUserTestId}`}>{t('compare.viewResult')}</Link>
                  ) : '-'}
                </li>
                <li className={cx('muted')}>{t('compare.createdAt', { date: formatDateTime(p.createdAt) })}</li>
                {p.replacedByPlanId && (
                  <li>
                    <Link href={`/dashboard/learning-paths/${p.replacedByPlanId}`}>{t('compare.replacedBy')}</Link>
                  </li>
                )}
              </ul>

              <div className={pageCx('planCardActions')}>
                <ButtonPrime as="link" href={`/dashboard/learning-paths/${p.learningPlanId}`} variant="outline" size="sm">
                  {t('compare.details')}
                </ButtonPrime>
                {p.status === LearningPlanStatus.ACTIVE && (
                  <ButtonPrime
                    as="link"
                    href={`/dashboard/learning-paths/${p.learningPlanId}/study`}
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
