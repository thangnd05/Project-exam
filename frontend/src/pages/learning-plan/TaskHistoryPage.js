import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPlanById, getTaskSessions } from '~/api/learningPlanApi';

const TASK_STATUS_LABEL = {
  ACTIVE: 'Đang học',
  PASSED: 'Đã pass',
  SKIPPED: 'Bỏ qua',
  LOCKED: 'Khoá',
};

const TIER_BADGE = {
  HIGH: 'bg-danger',
  MEDIUM: 'bg-warning text-dark',
  LOW: 'bg-secondary',
};

function pct(v) {
  if (v == null) return '—';
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(n)) return '—';
  return `${n.toFixed(2)}%`;
}

function formatDateTime(s) {
  return s ? new Date(s).toLocaleString('vi-VN', { hour12: false }) : '—';
}

function TaskHistoryPage() {
  const { learningPlanId, taskId } = useParams();
  const [plan, setPlan] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSessionsError(null);
    Promise.all([
      getPlanById(learningPlanId).catch((err) => {
        setError(err?.response?.data?.message || err.message);
        return null;
      }),
      getTaskSessions(learningPlanId, taskId).catch((err) => {
        setSessionsError(err?.response?.data?.message || err.message);
        return [];
      }),
    ])
      .then(([planData, sessionData]) => {
        setPlan(planData);
        setSessions(sessionData || []);
      })
      .finally(() => setLoading(false));
  }, [learningPlanId, taskId]);

  const task = useMemo(() => {
    if (!plan) return null;
    const allTasks = [
      ...(plan.tasks || []),
      ...((plan.partGroups || []).flatMap((g) => g.tasks || [])),
    ];
    return allTasks.find((t) => t.taskId === taskId) || null;
  }, [plan, taskId]);

  if (loading) return <div className="container py-4">Đang tải...</div>;
  if (error) return <div className="container py-4"><div className="alert alert-danger">{error}</div></div>;
  if (!plan || !task) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          Không tìm thấy ải này trong plan.{' '}
          <Link to={`/learning-plans/${learningPlanId}`}>Về plan →</Link>
        </div>
      </div>
    );
  }

  const baseline = task.baselineAccuracy != null ? Number(task.baselineAccuracy) : null;
  const best = task.bestAccuracy != null ? Number(task.bestAccuracy) : null;
  const pass = task.passAccuracy ?? 70;
  const delta = baseline != null && best != null ? best - baseline : null;

  return (
    <div className="container py-4">
      <div className="mb-3 d-flex gap-2 flex-wrap">
        <Link
          to={`/learning-plans/${learningPlanId}`}
          className="btn btn-sm btn-outline-secondary"
        >
          ← Plan #{plan.planSequence ?? '?'}
        </Link>
        <Link
          to={`/learning-plans/${learningPlanId}/study?taskId=${task.taskId}`}
          className="btn btn-sm btn-primary"
        >
          Học tiếp ải này
        </Link>
      </div>

      <h2 className="mb-1">
        {task.examPartName || 'Part'} · Ải {task.tagName || '—'}
      </h2>
      <div className="mb-3 d-flex gap-2 flex-wrap">
        <span className={`badge ${TIER_BADGE[task.priorityTier] || 'bg-secondary'}`}>
          {task.priorityTier || 'MEDIUM'} priority
        </span>
        <span className="badge bg-light text-dark">
          Trạng thái: {TASK_STATUS_LABEL[task.status] || task.status}
        </span>
        <span className="badge bg-light text-dark">
          Cần ≥ {pass}% để pass
        </span>
        {task.recommendedFirst && (
          <span className="badge bg-info text-dark">Nên học trước</span>
        )}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="small text-muted">Lúc chẩn đoán</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{pct(baseline)}</div>
              <div className="small text-muted">
                Sai {task.wrongCountAtDiagnosis ?? '—'} câu
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="small text-muted">Tốt nhất khi luyện</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{pct(best)}</div>
              {delta != null && (
                <div
                  className={`small ${delta > 0 ? 'text-success' : (delta < 0 ? 'text-danger' : 'text-muted')}`}
                >
                  {delta > 0 ? '+' : ''}{delta.toFixed(1)}% vs chẩn đoán
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="small text-muted">Số lần luyện</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{task.attemptCount ?? 0}</div>
              <div className="small text-muted">attempts</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="small text-muted">Ngưỡng pass</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{pass}%</div>
              {best != null && (
                <div className={`small ${best >= pass ? 'text-success' : 'text-warning'}`}>
                  {best >= pass ? 'Đã đạt ngưỡng' : `Còn ${(pass - best).toFixed(1)}%`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {baseline != null && best != null && (
        <div className="card mb-4">
          <div className="card-header"><strong>Tiến triển (chẩn đoán → tốt nhất)</strong></div>
          <div className="card-body">
            <div className="position-relative" style={{ height: 36, background: '#f1f3f5', borderRadius: 6 }}>
              <div
                className="position-absolute"
                style={{
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${Math.min(100, baseline)}%`,
                  background: '#ffc107',
                  opacity: 0.5,
                  borderRadius: 6,
                }}
                title={`Baseline ${pct(baseline)}`}
              />
              <div
                className="position-absolute"
                style={{
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${Math.min(100, best)}%`,
                  background: best >= pass ? '#198754' : '#0d6efd',
                  opacity: 0.85,
                  borderRadius: 6,
                }}
                title={`Best ${pct(best)}`}
              />
              <div
                className="position-absolute"
                style={{
                  left: `${pass}%`,
                  top: -4,
                  bottom: -4,
                  width: 2,
                  background: '#dc3545',
                }}
                title={`Pass line ${pass}%`}
              />
            </div>
            <div className="d-flex justify-content-between small text-muted mt-2">
              <span>0%</span>
              <span>Pass {pass}%</span>
              <span>100%</span>
            </div>
            <div className="small text-muted mt-2">
              <span className="badge" style={{ background: '#ffc107', color: '#000' }}>Baseline</span>{' '}
              {pct(baseline)} ·{' '}
              <span className="badge" style={{ background: best >= pass ? '#198754' : '#0d6efd' }}>Best</span>{' '}
              {pct(best)}
            </div>
          </div>
        </div>
      )}

      {task.studyResource && (
        <div className="card mb-4">
          <div className="card-header"><strong>Tài liệu được gắn cho ải</strong></div>
          <div className="card-body">
            <a href={task.studyResource.url} target="_blank" rel="noreferrer">
              {task.studyResource.title}
            </a>
            {task.studyResource.description && (
              <p className="small text-muted mb-0 mt-1">{task.studyResource.description}</p>
            )}
          </div>
        </div>
      )}

      <div className="card mb-3">
        <div className="card-header"><strong>Lịch sử các lần luyện</strong></div>
        {sessionsError && (
          <div className="card-body">
            <div className="alert alert-danger mb-0 small">{sessionsError}</div>
          </div>
        )}
        {!sessionsError && sessions.length === 0 && (
          <div className="card-body text-muted">
            Chưa có lần luyện nào cho ải này.
          </div>
        )}
        {!sessionsError && sessions.length > 0 && (
          <table className="table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Bắt đầu</th>
                <th>Nộp</th>
                <th className="text-end">Số câu</th>
                <th className="text-end">Accuracy</th>
                <th>Kết quả</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, idx) => (
                <tr key={s.sessionId}>
                  <td>{sessions.length - idx}</td>
                  <td className="small">{formatDateTime(s.startedAt)}</td>
                  <td className="small">{formatDateTime(s.submittedAt)}</td>
                  <td className="text-end">{s.questionCount ?? '—'}</td>
                  <td className="text-end">
                    {s.accuracy != null ? `${s.accuracy}%` : '—'}
                  </td>
                  <td>
                    {s.status === 'IN_PROGRESS' ? (
                      <span className="badge bg-warning text-dark">Đang làm</span>
                    ) : s.passed === true ? (
                      <span className="badge bg-success">Pass</span>
                    ) : s.passed === false ? (
                      <span className="badge bg-secondary">Chưa pass</span>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </td>
                  <td className="small text-muted">{s.planStage || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default TaskHistoryPage;
