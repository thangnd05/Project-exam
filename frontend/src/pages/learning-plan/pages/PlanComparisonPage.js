import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { formatDateTime24 as formatDate } from '~/utils/format-date-time';
import PlanComparisonCharts from '../components/PlanComparisonCharts';
import { usePlanComparison } from './hooks/usePlanComparison';
import pageStyles from '../styles/PlanComparisonPage.module.scss';
import styles from '../styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);
const pageCx = classNames.bind(pageStyles);

const STATUS_LABEL = {
  ACTIVE: 'Đang học',
  COMPLETED: 'Hoàn thành',
  REPLACED: 'Đã thay',
  ABANDONED: 'Đã bỏ',
};

const STATUS_VARIANT = {
  ACTIVE: 'badgePrimary',
  COMPLETED: 'badgeSuccess',
  REPLACED: 'badgeMuted',
  ABANDONED: 'badgeDanger',
};

function PlanComparisonPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [examTypeId, setExamTypeId] = useState(searchParams.get('examTypeId') || '');

  const { examTypes, plans, loading, error } = usePlanComparison(examTypeId);

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
      const readiness = p.baselineReadiness ?? p.currentReadiness ?? 0;
      const prevReadiness = prev
        ? prev.baselineReadiness ?? prev.currentReadiness ?? null
        : null;
      const diffVsPrev =
        prevReadiness != null ? readiness - prevReadiness : null;

      return {
        key: p.learningPlanId,
        label: `Plan #${p.planSequence ?? '?'}`,
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
      <div className={cx('headerBar')}>
        <h2 className={cx('title')}>So sánh các Plan</h2>
        <div className={cx('actionBar')}>
          <Link
            to={examTypeId ? `/learning-plans/generate?examTypeId=${examTypeId}` : '/learning-plans/generate'}
            className={cx('btn', 'btnOutline', 'btnSm')}
          >
            Danh sách plan
          </Link>
          <Link
            to={examTypeId ? `/my-target/dashboard?examTypeId=${examTypeId}` : '/my-target/dashboard'}
            className={cx('btn', 'btnOutline', 'btnSm')}
          >
            Tổng quan mục tiêu
          </Link>
        </div>
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
          <span>Chưa có plan nào cho kỳ thi này.</span>
          <Link to="/learning-plans/generate" className={cx('btn', 'btnPrimary', 'btnSm')}>
            Sinh plan đầu tiên
          </Link>
        </div>
      )}

      {sorted.length > 0 && (
        <>
          <PlanComparisonCharts chartData={chartData} examTypeName={examTypeName} />

          <div className={cx('timelineGrid')}>
            {sorted.map((p, idx) => {
              const prev = idx > 0 ? sorted[idx - 1] : null;
              const cur = p.baselineReadiness ?? p.currentReadiness;
              const prevReadiness = prev ? (prev.baselineReadiness ?? prev.currentReadiness) : null;
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
                    <span className={cx('planNo')}>Plan #{p.planSequence ?? '?'}</span>
                    <span className={cx('badge', STATUS_VARIANT[p.status] || 'badgeMuted')}>
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                  </div>

                  <ul className={cx('metaList')}>
                    <li>
                      <strong>Baseline readiness:</strong>
                      {cur != null ? ` ${cur}%` : ' —'}
                      {diff != null && (
                        <span
                          className={cx('statDelta', {
                            up: diff > 0,
                            down: diff < 0,
                            flat: diff === 0,
                          })}
                        >
                          ({diff > 0 ? '+' : ''}{diff}% vs #{prev.planSequence})
                        </span>
                      )}
                    </li>
                    <li><strong>Giai đoạn:</strong> {p.planStage || '—'}</li>
                    <li>
                      <strong>Ải đã pass:</strong>{' '}
                      {p.passedTasks ?? 0}/{p.totalTasks ?? 0}
                    </li>
                    <li>
                      <strong>Mock nguồn:</strong>{' '}
                      {p.sourceUserTestId ? (
                        <Link to={`/tests/result/${p.sourceUserTestId}`}>
                          <code className={cx('code')}>{p.sourceUserTestId.slice(0, 8)}…</code>
                        </Link>
                      ) : '—'}
                    </li>
                    <li className={cx('muted')}>
                      Tạo: {formatDate(p.createdAt)}
                    </li>
                    {p.replacedByPlanId && (
                      <li>
                        <Link to={`/learning-plans/${p.replacedByPlanId}`}>
                          Đã thay bằng plan kế tiếp →
                        </Link>
                      </li>
                    )}
                  </ul>

                  <div className={pageCx('planCardActions')}>
                    <Link
                      to={`/learning-plans/${p.learningPlanId}`}
                      className={cx('btn', 'btnOutline', 'btnSm')}
                    >
                      Chi tiết
                    </Link>
                    {p.status === 'ACTIVE' && (
                      <Link
                        to={`/learning-plans/${p.learningPlanId}/study`}
                        className={cx('btn', 'btnPrimary', 'btnSm')}
                      >
                        Học tiếp
                      </Link>
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
