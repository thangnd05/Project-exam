import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listPlans } from '~/api/learningPlanApi';

function MyPlansPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [examTypeId, setExamTypeId] = useState(searchParams.get('examTypeId') || '');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPlans = async (etId) => {
    if (!etId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listPlans(etId);
      setPlans(data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examTypeId) fetchPlans(examTypeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ examTypeId });
    fetchPlans(examTypeId);
  };

  return (
    <div className="container py-4">
      <h2 className="mb-3">Kế hoạch học của tôi</h2>

      <div className="mb-3">
        <Link to="/learning-plans/generate" className="btn btn-primary btn-sm">
          + Sinh plan mới
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="row g-2 mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="examTypeId"
            value={examTypeId}
            onChange={(e) => setExamTypeId(e.target.value)}
            required
          />
        </div>
        <div className="col-md-2">
          <button type="submit" className="btn btn-outline-primary w-100">Load</button>
        </div>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div>Đang tải...</div>}

      {!loading && plans.length === 0 && examTypeId && (
        <div className="text-muted">Chưa có plan nào cho examType này.</div>
      )}

      {plans.map((p) => (
        <div key={p.learningPlanId} className="card mb-2">
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <div>
                <strong>Plan #{p.planSequence ?? '?'}</strong>
                {' '}
                <code className="small">{p.learningPlanId}</code>
              </div>
              <small className="text-muted">
                {p.status || 'ACTIVE'} · {p.planStage || 'FOUNDATION'}
                {' · '}
                ải {p.passedTasks ?? 0}/{p.totalTasks ?? 0}
                {' · '}
                readiness {p.baselineReadiness ?? p.currentReadiness ?? '—'}%
              </small>
            </div>
            <div className="d-flex gap-2">
              <Link
                to={`/learning-plans/${p.learningPlanId}#chon-ai-hoc`}
                className="btn btn-sm btn-primary"
              >
                Chọn ải
              </Link>
              <Link to={`/learning-plans/${p.learningPlanId}`} className="btn btn-sm btn-outline-primary">
                Xem
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MyPlansPage;
