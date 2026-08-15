'use client';

import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import TargetPlanTabs from '@/app/features/diagnostic/TargetPlanTabs';
import { formatDateTime24 as formatDate } from '@/app/utils/format-date-time';
import PlanComparisonCharts from '../components/PlanComparisonCharts';
import { usePlanComparison } from '@/app/features/diagnostic/learning-plans/hooks/usePlanComparison';
import { planStageLabel, planStatusLabel, planStatusVariant } from '../planLabels';
import pageStyles from '../styles/PlanComparisonPage.module.scss';
import styles from '@/app/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);
const pageCx = classNames.bind(pageStyles);

function PlanComparisonPage() {
  const [searchParams, setSearchParams] = useSearchParamsState();
  const [examTypeId, setExamTypeId] = useState(searchParams.get('examTypeId') || '');

  const { examTypes, plans, isLoading: loading, error } = usePlanComparison(examTypeId);

  useEffect(() => {
    if (!examTypeId && examTypes.length > 0) {
      setExamTypeId(examTypes[0].examTypeId);
    }
  }, [examTypes, examTypeId]);

  const sorted = useMemo(() => {
    return [...plans].sort((a, b) => (a.planSequence ?? 0) - (b.planSequence ?? 0));
  }, [plans]);

  const examTypeName = useMemo(
    () => examTypes.find((et) => et.examTypeId === examTypeId)?.name || '',
    [examTypes, examTypeId],
  );

  const chartData = useMemo(() => {
    return sorted.map((p, idx) => {
      const prev = idx > 0 ? sorted[idx - 1] : null;

      const readiness = p.baselineReadiness ?? 0;
      const prevReadiness = prev ? prev.baselineReadiness ?? null : null;
      const diffVsPrev =
        prevReadiness != null ? readiness - prevReadiness : null;

      return {
        key: p.learningPlanId,
        label: `Lộ trình #${p.planSequence ?? '?'}`,
        readiness,
        status: p.status,
        planStage: p.planStage,
        createdAt: formatDate(p.createdAt),
        diffVsPrev,
      };
    });
  }, [sorted]);

  return (
    <div className={cx('wrapper')}>
      <TargetPlanTabs active="compare" examTypeId={examTypeId} />
      <div className={cx('headerBar')}>
        <h2 className={cx('title')}>So sánh các lộ trình</h2>
      </div>

      <div className={cx('filterRow')}>
        <div className={cx('fieldGroup')}>
          <label className={cx('fieldLabel')}>Loại kỳ thi</label>
          <select
            className={cx('select')}
            value={examTypeId}
            onChange={(e) => {
              setExamTypeId(e.target.value);
              setSearchParams({ examTypeId: e.target.value });
            }}
          >
            {examTypes.map((et) => (
              <option key={et.examTypeId} value={et.examTypeId}>{et.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}
      {loading && <div className={cx('loading')}>Đang tải...</div>}

      {!loading && sorted.length === 0 && (
        <div className={cx('alert', 'alertInfo')}>
          <span>Chưa có lộ trình nào cho kỳ thi này.</span>
          <ButtonPrime as="link" href="/learning-plans/generate" variant="primary" size="sm">
            Sinh lộ trình đầu tiên
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
                    active: p.status === 'ACTIVE',
                    completed: p.status === 'COMPLETED',
                  })}
                >
                  <div className={cx('planHead')}>
                    <span className={cx('planNo')}>Lộ trình #{p.planSequence ?? '?'}</span>
                    <span className={cx('badge', planStatusVariant(p.status))}>
                      {planStatusLabel(p.status)}
                    </span>
                  </div>

                  <ul className={cx('metaList')}>
                    <li>
                      <strong>Độ sẵn sàng ban đầu:</strong>
                      {cur != null ? ` ${cur}%` : ' '}
                      {diff != null && (
                        <span
                          className={cx('statDelta', {
                            up: diff > 0,
                            down: diff < 0,
                            flat: diff === 0,
                          })}
                        >
                          ({diff > 0 ? '+' : ''}{diff}% so với lộ trình #{prev.planSequence})
                        </span>
                      )}
                    </li>
                    <li><strong>Giai đoạn:</strong> {planStageLabel(p.planStage)}</li>
                    <li>
                      <strong>Ải đã qua:</strong>{' '}
                      {p.passedTasks ?? 0}/{p.totalTasks ?? 0}
                    </li>
                    <li>
                      <strong>Bài thi nguồn:</strong>{' '}
                      {p.sourceUserTestId ? (
                        <Link href={`/tests/result/${p.sourceUserTestId}`}>Xem kết quả</Link>
                      ) : '—'}
                    </li>
                    <li className={cx('muted')}>
                      Tạo: {formatDate(p.createdAt)}
                    </li>
                    {p.replacedByPlanId && (
                      <li>
                        <Link href={`/learning-plans/${p.replacedByPlanId}`}>
                          Đã thay bằng lộ trình kế tiếp
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
                      Chi tiết
                    </ButtonPrime>
                    {p.status === 'ACTIVE' && (
                      <ButtonPrime
                        as="link"
                        href={`/learning-plans/${p.learningPlanId}/study`}
                        variant="primary"
                        size="sm"
                      >
                        Học tiếp
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

export default PlanComparisonPage;
