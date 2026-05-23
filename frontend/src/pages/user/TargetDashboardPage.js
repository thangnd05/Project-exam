import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from '~/api/axiosClient';
import { getExamTypes } from '~/api/examTypeApi';
import { getExamParts } from '~/api/examPartApi';
import { getUserTarget } from '~/api/userTargetApi';
import { listPlans } from '~/api/learningPlanApi';
import { getEnhancedResult } from '~/api/enhancedResultApi';

function formatDate(s) {
  return s ? new Date(s).toLocaleString('vi-VN', { hour12: false }) : '—';
}

function TargetDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [examTypes, setExamTypes] = useState([]);
  const [examParts, setExamParts] = useState([]);
  const [examTypeId, setExamTypeId] = useState(searchParams.get('examTypeId') || '');

  const [target, setTarget] = useState(null);
  const [plans, setPlans] = useState([]);
  const [latestMock, setLatestMock] = useState(null);
  const [latestEnhanced, setLatestEnhanced] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getExamTypes().then(setExamTypes).catch(() => {});
    getExamParts().then(setExamParts).catch(() => {});
  }, []);

  // Auto-pick first examType if user didn't choose
  useEffect(() => {
    if (!examTypeId && examTypes.length > 0) {
      setExamTypeId(examTypes[0].examTypeId);
    }
  }, [examTypes, examTypeId]);

  const loadDashboard = useCallback(async () => {
    if (!examTypeId) return;
    setLoading(true);
    setError(null);
    try {
      // Target
      const t = await getUserTarget(examTypeId).catch(() => null);
      setTarget(t);

      // Plans
      const ps = await listPlans(examTypeId).catch(() => []);
      setPlans(ps || []);

      // Lọc theo examTypeId — UserTestResponse đã có examTypeId.
      const res = await axios.get('/api/user-tests/my');
      const arr = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const completed = arr
        .filter((u) => u.status === 'COMPLETED' && u.finishedAt)
        .filter((u) => !u.examTypeId || u.examTypeId === examTypeId)
        .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
      const latest = completed[0] || null;
      setLatestMock(latest);

      // Enhanced cho mock gần nhất để biết readiness + isTargetMet
      if (latest?.userTestId) {
        try {
          const r = await getEnhancedResult(latest.userTestId);
          setLatestEnhanced(r.data);
        } catch {
          setLatestEnhanced(null);
        }
      } else {
        setLatestEnhanced(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [examTypeId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const activePlan = useMemo(
    () => (plans || []).find((p) => p.status === 'ACTIVE') || null,
    [plans],
  );

  const partNameOf = (id) =>
    examParts.find((p) => p.examPartId === id)?.name || id;

  const enhancedMatchesType =
    latestEnhanced && (!latestEnhanced.examTypeId || latestEnhanced.examTypeId === examTypeId);

  // Ưu tiên target.achievedAt (đáng tin); fallback infer từ mock gần nhất.
  const isAchieved = Boolean(target?.achievedAt)
    || (enhancedMatchesType && latestEnhanced?.isTargetMet === true);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="mb-0">Tổng quan mục tiêu</h2>
        <div className="d-flex gap-2">
          <Link to="/my-target" className="btn btn-sm btn-outline-secondary">
            Cài đặt target
          </Link>
          <Link to="/my-target/mocks" className="btn btn-sm btn-outline-secondary">
            Lịch sử Mock
          </Link>
          <Link
            to={examTypeId ? `/learning-plans/compare?examTypeId=${examTypeId}` : '/learning-plans'}
            className="btn btn-sm btn-outline-secondary"
          >
            So sánh Plan
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

      {!loading && !target?.hasTarget && examTypeId && (
        <div className="alert alert-warning">
          Bạn chưa đặt mục tiêu cho kỳ thi này.{' '}
          <Link to={`/my-target?examTypeId=${examTypeId}`}>Đặt mục tiêu ngay →</Link>
        </div>
      )}

      {!loading && target?.hasTarget && (
        <>
          {isAchieved && (
            <div className="alert alert-success d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <strong>Bạn đã đạt mục tiêu {target.targetScore}!</strong>{' '}
                {target.achievedAt
                  ? <>Đạt lúc: <strong>{formatDate(target.achievedAt)}</strong>.</>
                  : <>Mock gần nhất: <strong>{latestEnhanced?.totalScore}</strong>.</>}
              </div>
              <Link
                to={`/my-target/achieved?examTypeId=${examTypeId}`}
                className="btn btn-sm btn-success"
              >
                Đặt mục tiêu mới
              </Link>
            </div>
          )}

          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="text-muted small">Mục tiêu điểm</div>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>{target.targetScore}</div>
                  {latestEnhanced?.totalScore != null && enhancedMatchesType && (
                    <div className="small text-muted">
                      Hiện tại (mock gần nhất): <strong>{latestEnhanced.totalScore}</strong>
                      {' '}
                      ({latestEnhanced.totalScore >= target.targetScore ? 'đạt' : `còn ${target.targetScore - latestEnhanced.totalScore}đ`})
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="text-muted small">Readiness mock gần nhất</div>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>
                    {enhancedMatchesType ? `${latestEnhanced?.readinessScore ?? '—'}%` : '—'}
                  </div>
                  <div className="small text-muted">
                    {enhancedMatchesType
                      ? latestEnhanced?.readinessLevel || ''
                      : 'Chưa có mock cho kỳ thi này'}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="text-muted small">Plan đang học</div>
                  {activePlan ? (
                    <>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        Plan #{activePlan.planSequence ?? '?'}
                      </div>
                      <div className="small text-muted mb-2">
                        Baseline {activePlan.baselineReadiness ?? '—'}% ·{' '}
                        {activePlan.passedTasks ?? 0}/{activePlan.totalTasks ?? 0} ải đã pass
                      </div>
                      <Link
                        to={`/learning-plans/${activePlan.learningPlanId}`}
                        className="btn btn-sm btn-primary"
                      >
                        Mở plan
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="text-muted">Chưa có plan đang học.</div>
                      {latestMock?.userTestId && (
                        <Link
                          to={`/learning-plans/generate?userTestId=${latestMock.userTestId}`}
                          className="btn btn-sm btn-primary mt-2"
                        >
                          Sinh plan từ mock
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-header"><strong>% từng Part — hiện tại vs aim</strong></div>
            <div className="card-body p-0">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Part</th>
                    <th className="text-end">Aim</th>
                    <th className="text-end">Hiện tại (từ mock gần nhất)</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {(target.partRequirements || []).map((p) => {
                    const cur = p.currentScore != null ? Number(p.currentScore) : null;
                    const reached = cur != null && p.requiredPercentage != null
                      ? cur >= p.requiredPercentage
                      : null;
                    return (
                      <tr key={p.examPartId}>
                        <td>{partNameOf(p.examPartId)}</td>
                        <td className="text-end">{p.requiredPercentage}%</td>
                        <td className="text-end">{cur != null ? `${cur.toFixed(2)}%` : '—'}</td>
                        <td>
                          {reached === null ? (
                            <span className="badge bg-secondary">Chưa có mock</span>
                          ) : reached ? (
                            <span className="badge bg-success">Đạt aim</span>
                          ) : (
                            <span className="badge bg-warning text-dark">
                              Còn {(p.requiredPercentage - cur).toFixed(1)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {latestMock && (
            <div className="card mb-3">
              <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <div className="small text-muted">Mock gần nhất</div>
                  <div>
                    <strong>{formatDate(latestMock.finishedAt)}</strong>
                    {' · '}Score {latestMock.totalScore ?? '—'}
                    {' · '}<code className="small">{latestMock.userTestId.slice(0, 8)}…</code>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <Link
                    to={`/tests/result/${latestMock.userTestId}`}
                    className="btn btn-sm btn-outline-primary"
                  >
                    Xem chẩn đoán
                  </Link>
                  <Link
                    to={`/learning-plans/generate?userTestId=${latestMock.userTestId}`}
                    className="btn btn-sm btn-outline-primary"
                  >
                    Sinh plan
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="d-flex gap-2 flex-wrap">
            <Link to={`/next-step?examTypeId=${examTypeId}`} className="btn btn-primary">
              Tôi nên làm gì tiếp theo?
            </Link>
            <Link to="/my-tests" className="btn btn-outline-secondary">
              Tất cả bài đã làm
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default TargetDashboardPage;
