import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getExamTypes } from '~/api/examTypeApi';
import { listPlans } from '~/api/learningPlanApi';

const STATUS_LABEL = {
  ACTIVE: 'Đang học',
  COMPLETED: 'Hoàn thành',
  REPLACED: 'Đã thay',
  ABANDONED: 'Đã bỏ',
};

const STATUS_BADGE = {
  ACTIVE: 'bg-primary',
  COMPLETED: 'bg-success',
  REPLACED: 'bg-secondary',
  ABANDONED: 'bg-danger',
};

function formatDate(s) {
  return s ? new Date(s).toLocaleString('vi-VN', { hour12: false }) : '—';
}

function PlanComparisonPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [examTypes, setExamTypes] = useState([]);
  const [examTypeId, setExamTypeId] = useState(searchParams.get('examTypeId') || '');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getExamTypes().then(setExamTypes).catch(() => {});
  }, []);

  useEffect(() => {
    if (!examTypeId && examTypes.length > 0) {
      setExamTypeId(examTypes[0].examTypeId);
    }
  }, [examTypes, examTypeId]);

  useEffect(() => {
    if (!examTypeId) return;
    setLoading(true);
    setError(null);
    listPlans(examTypeId)
      .then((data) => setPlans(data || []))
      .catch((err) => setError(err?.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [examTypeId]);

  const sorted = useMemo(() => {
    return [...plans].sort((a, b) => (a.planSequence ?? 0) - (b.planSequence ?? 0));
  }, [plans]);

  const maxReadiness = Math.max(
    100,
    ...sorted.map((p) => p.baselineReadiness ?? p.currentReadiness ?? 0),
  );

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="mb-0">So sánh các Plan</h2>
        <div className="d-flex gap-2">
          <Link
            to={examTypeId ? `/learning-plans?examTypeId=${examTypeId}` : '/learning-plans'}
            className="btn btn-sm btn-outline-secondary"
          >
            Danh sách plan
          </Link>
          <Link
            to={examTypeId ? `/my-target/dashboard?examTypeId=${examTypeId}` : '/my-target/dashboard'}
            className="btn btn-sm btn-outline-secondary"
          >
            Tổng quan mục tiêu
          </Link>
        </div>
      </div>

      <div className="mb-3" style={{ maxWidth: 360 }}>
        <label className="form-label small text-muted">Loại kỳ thi</label>
        <select
          className="form-select"
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

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div>Đang tải...</div>}

      {!loading && sorted.length === 0 && (
        <div className="alert alert-info">
          Chưa có plan nào cho kỳ thi này.{' '}
          <Link to="/learning-plans/generate">Sinh plan đầu tiên →</Link>
        </div>
      )}

      {sorted.length > 0 && (
        <>
          <div className="card mb-4">
            <div className="card-header">
              <strong>Tiến triển readiness qua các plan</strong>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-end gap-3" style={{ height: 200 }}>
                {sorted.map((p) => {
                  const v = p.baselineReadiness ?? p.currentReadiness ?? 0;
                  const h = (v / maxReadiness) * 100;
                  const isActive = p.status === 'ACTIVE';
                  const bg = isActive ? '#0d6efd' : (p.status === 'COMPLETED' ? '#198754' : '#adb5bd');
                  return (
                    <div
                      key={p.learningPlanId}
                      className="d-flex flex-column align-items-center"
                      style={{ flex: 1, minWidth: 60 }}
                    >
                      <div className="small fw-semibold mb-1">{v}%</div>
                      <div
                        style={{
                          width: '100%',
                          height: `${h}%`,
                          background: bg,
                          borderRadius: 6,
                          minHeight: 8,
                          transition: 'height .3s',
                        }}
                      />
                      <div className="small text-muted mt-2">
                        Plan #{p.planSequence ?? '?'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="small text-muted mb-0 mt-3">
                Readiness chính là <code>baseline_readiness</code> chốt khi tạo plan từ mock chẩn đoán.
                Học ải không thay đổi con số này — chỉ mock mới + plan mới mới có readiness mới.
              </p>
            </div>
          </div>

          <div className="row">
            {sorted.map((p, idx) => {
              const prev = idx > 0 ? sorted[idx - 1] : null;
              const cur = p.baselineReadiness ?? p.currentReadiness;
              const prevReadiness = prev ? (prev.baselineReadiness ?? prev.currentReadiness) : null;
              const diff = prevReadiness != null && cur != null ? cur - prevReadiness : null;

              return (
                <div className="col-md-6 col-lg-4 mb-3" key={p.learningPlanId}>
                  <div className={`card h-100 ${p.status === 'ACTIVE' ? 'border-primary' : ''}`}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">Plan #{p.planSequence ?? '?'}</h5>
                        <span className={`badge ${STATUS_BADGE[p.status] || 'bg-secondary'}`}>
                          {STATUS_LABEL[p.status] || p.status}
                        </span>
                      </div>

                      <ul className="list-unstyled small mb-3">
                        <li>
                          <strong>Baseline readiness:</strong>{' '}
                          {cur != null ? `${cur}%` : '—'}
                          {diff != null && (
                            <span
                              className={diff > 0 ? 'text-success' : (diff < 0 ? 'text-danger' : 'text-muted')}
                              style={{ marginLeft: 6 }}
                            >
                              ({diff > 0 ? '+' : ''}{diff}% vs Plan #{prev.planSequence})
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
                              <code>{p.sourceUserTestId.slice(0, 8)}…</code>
                            </Link>
                          ) : '—'}
                        </li>
                        <li className="text-muted">
                          <small>Tạo: {formatDate(p.createdAt)}</small>
                        </li>
                        {p.replacedByPlanId && (
                          <li>
                            <Link to={`/learning-plans/${p.replacedByPlanId}`}>
                              Đã thay bằng plan kế tiếp →
                            </Link>
                          </li>
                        )}
                      </ul>

                      <div className="d-flex gap-2 flex-wrap">
                        <Link
                          to={`/learning-plans/${p.learningPlanId}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          Xem chi tiết
                        </Link>
                        {p.status === 'ACTIVE' && (
                          <Link
                            to={`/learning-plans/${p.learningPlanId}/study`}
                            className="btn btn-sm btn-primary"
                          >
                            Học tiếp
                          </Link>
                        )}
                      </div>
                    </div>
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
