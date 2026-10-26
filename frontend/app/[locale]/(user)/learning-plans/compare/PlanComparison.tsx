'use client';

import Link from '@/app/i18n/navigation';
import { useSearchParamsState } from '@/app/hooks/useSearchParamsState';
import { examTypeIdFromParams, setExamParam, useNormalizeExamParam } from '@/app/features/exam-types/hooks/useExamParam';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import TargetPlanTabs from '@/app/features/my-target/TargetPlanTabs/TargetPlanTabs';
import { formatDateTime } from '@/app/utils/format-date-time';
import dynamic from 'next/dynamic';
import { usePlanComparison } from './_hooks/usePlanComparison';
import { planStageLabel, planStatusLabel, planStatusVariant } from '@/app/features/learning-plans/planLabels';
import pageStyles from './PlanComparison.module.scss';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import { LearningPlanStatus } from '@/app/enums';

const cx = classNames.bind(styles);
const pageCx = classNames.bind(pageStyles);

const PlanComparisonCharts = dynamic(() => import('./_components/PlanComparisonCharts'), {
  ssr: false,
});

function PlanComparison() {
  const t = useTranslations('LearningPlans');
  const tc = useTranslations('Common');
  const [searchParams, setSearchParams] = useSearchParamsState();
  // ?exam=<slug> chỉ dịch ra id khi danh sách kỳ thi tải xong, nên bắt đầu rỗng rồi chọn ngay khi danh sách về (xem bên dưới).
  const [examTypeId, setExamTypeId] = useState('');

  const { examTypes, plans, isLoading: loading, error } = usePlanComparison(examTypeId);

  useNormalizeExamParam(examTypes);

  // Danh sách kỳ thi về thì chọn kỳ thi theo ?exam= hoặc kỳ đầu tiên (điều chỉnh state ngay khi render).
  if (!examTypeId && examTypes.length > 0) {
    setExamTypeId(examTypeIdFromParams(searchParams, examTypes) || examTypes[0].examTypeId);
  }

  const sorted = useMemo(() => {
    return [...plans].sort((a, b) => (a.planSequence ?? 0) - (b.planSequence ?? 0));
  }, [plans]);

  const examTypeName = useMemo(
    () => examTypes.find((et) => et.examTypeId === examTypeId)?.name || '',
    [examTypes, examTypeId],
  );

  const chartData = useMemo(() => {
    // Lộ trình sinh theo chương trình học không có readiness ban đầu nên không so sánh được.
    const diagnosed = sorted.filter((p) => p.baselineReadiness != null);
    return diagnosed.map((p, idx) => {
      const prev = idx > 0 ? diagnosed[idx - 1] : null;

      const readiness = p.baselineReadiness as number;
      const prevReadiness = prev ? prev.baselineReadiness ?? null : null;
      const diffVsPrev =
        prevReadiness != null ? readiness - prevReadiness : null;

      return {
        key: p.learningPlanId,
        label: t('common.planName', { sequence: p.planSequence ?? '?' }),
        readiness,
        status: p.status,
        planStage: p.planStage,
        createdAt: formatDateTime(p.createdAt),
        diffVsPrev,
      };
    });
  }, [sorted, t]);

  return (
    <div className={cx('wrapper')}>
      <TargetPlanTabs active="compare" examTypeId={examTypeId} examTypes={examTypes} />
      <div className={cx('headerBar')}>
        <h2 className={cx('title')}>{t('compare.title')}</h2>
      </div>

      <div className={cx('filterRow')}>
        <div className={cx('fieldGroup')}>
          <label className={cx('fieldLabel')}>{t('compare.examType')}</label>
          <select
            className={cx('select')}
            value={examTypeId}
            onChange={(e) => {
              setExamTypeId(e.target.value);
              setSearchParams(setExamParam(new URLSearchParams(), e.target.value, examTypes));
            }}
          >
            {examTypes.map((et) => (
              <option key={et.examTypeId} value={et.examTypeId}>{et.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}
      {loading && <div className={cx('loading')}>{tc('loading')}</div>}

      {!loading && sorted.length === 0 && (
        <div className={cx('alert', 'alertInfo')}>
          <span>{t('common.noPlansForExam')}</span>
          <ButtonPrime as="link" href="/learning-plans/generate" variant="primary" size="sm">
            {t('compare.generateFirst')}
          </ButtonPrime>
        </div>
      )}

      {sorted.length > 0 && (
        <>
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
                    <span className={cx('badge', planStatusVariant(p.status))}>
                      {planStatusLabel(t, p.status)}
                    </span>
                  </div>

                  <ul className={cx('metaList')}>
                    <li>
                      <strong>{t('common.baselineReadiness')}</strong>
                      {cur != null ? ` ${cur}%` : ' '}
                      {diff != null && (
                        <span
                          className={cx('statDelta', {
                            up: diff > 0,
                            down: diff < 0,
                            flat: diff === 0,
                          })}
                        >
                          {t('compare.diffVsPrev', { diff: `${diff > 0 ? '+' : ''}${diff}`, sequence: prev?.planSequence ?? '' })}
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
                    <li className={cx('muted')}>
                      {t('compare.createdAt', { date: formatDateTime(p.createdAt) })}
                    </li>
                    {p.replacedByPlanId && (
                      <li>
                        <Link href={`/learning-plans/${p.replacedByPlanId}`}>
                          {t('compare.replacedBy')}
                        </Link>
                      </li>
                    )}
                  </ul>

                  <div className={pageCx('planCardActions')}>
                    <ButtonPrime
                      as="link"
                      href={`/learning-plans/${p.learningPlanId}`}
                      variant="outline"
                      size="sm"
                    >
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
        </>
      )}
    </div>
  );
}

export default PlanComparison;
