import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '~/api/axiosClient';
import { generatePlan } from '~/api/learningPlanApi';
import PlanPartTaskList from './components/PlanPartTaskList';

function GeneratePlanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [userTests, setUserTests] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [userTestId, setUserTestId] = useState(searchParams.get('userTestId') || '');
  const [deadlineDays, setDeadlineDays] = useState('');
  const [targetScore, setTargetScore] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let mounted = true;
    axios.get('/api/user-tests/my')
      .then((res) => {
        if (!mounted) return;
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const completed = data.filter((t) => t.status === 'COMPLETED');
        setUserTests(completed);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.message || err.message);
      })
      .finally(() => { if (mounted) setLoadingList(false); });
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const payload = { userTestId };
      if (deadlineDays !== '') payload.deadlineDays = Number(deadlineDays);
      if (targetScore !== '') payload.targetScore = Number(targetScore);
      const data = await generatePlan(payload);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Lỗi không xác định');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (s) => s ? new Date(s).toLocaleString('vi-VN', { hour12: false }) : '-';

  return (
    <div className="container py-4">
      <h2 className="mb-3">Sinh lộ trình vượt ải</h2>

      <p className="text-muted">
        Một plan gồm nhiều Part (mỗi Part tách riêng, không trộn đề).
        Trong mỗi Part: các tag yếu → đọc tài liệu → 10 câu → pass mới sang ải/Part tiếp.
      </p>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-3">
          <label className="form-label">Bài thi nguồn (đã COMPLETED)</label>
          {loadingList ? (
            <div>Đang tải danh sách bài thi...</div>
          ) : userTests.length === 0 ? (
            <div className="alert alert-warning">
              Bạn chưa có bài thi nào đã hoàn thành. Hãy làm Quick Challenge hoặc Full Mock trước.
            </div>
          ) : (
            <select
              className="form-select"
              value={userTestId}
              onChange={(e) => setUserTestId(e.target.value)}
              required
            >
              <option value="">-- Chọn bài thi --</option>
              {userTests.map((t) => (
                <option key={t.userTestId} value={t.userTestId}>
                  {formatDate(t.finishedAt)} · Score {t.totalScore ?? '—'} · testId={t.testId.slice(0, 8)}…
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Ngày đến ngày thi (optional)</label>
            <input
              type="number"
              className="form-control"
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(e.target.value)}
              placeholder="VD: 28"
              min={3}
              max={365}
            />
            <small className="text-muted">Chỉ để ước lượng, không ép sang ải mới.</small>
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Target score (optional)</label>
            <input
              type="number"
              className="form-control"
              value={targetScore}
              onChange={(e) => setTargetScore(e.target.value)}
              placeholder="VD: 750"
            />
            <small className="text-muted">Bỏ trống → dùng UserTarget đã set.</small>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || !userTestId || userTests.length === 0}
        >
          {submitting ? 'Đang sinh lộ trình...' : 'Sinh lộ trình'}
        </button>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      {result?.targetAchieved && (
        <div className="alert alert-success">
          <p className="mb-0">{result.summary}</p>
          <p className="small mb-0 mt-2">
            Bạn có thể đặt mục tiêu cao hơn trong phần Target, hoặc tiếp tục làm mock để duy trì phong độ.
          </p>
        </div>
      )}

      {result && !result.targetAchieved && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <strong>
                Plan #{result.planSequence ?? '—'}:
              </strong>
              {' '}
              <code>{result.learningPlanId}</code>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => navigate(`/learning-plans/${result.learningPlanId}#chon-ai-hoc`)}
              >
                Chọn ải để học
              </button>
            </div>
          </div>
          <div className="card-body">
            <p>{result.summary}</p>
            <ul className="list-unstyled mb-3">
              <li><strong>Trạm:</strong> {result.planStage}</li>
              <li>
                <strong>Readiness (bài chẩn đoán):</strong>{' '}
                {result.baselineReadiness ?? result.currentReadiness}% ({result.readinessLevel})
              </li>
              <li><strong>Target:</strong> {result.targetScore ?? 'N/A'}</li>
              <li><strong>Ải:</strong> {result.totalTasks} (ước tính ~{result.estimatedDaysRemaining} ngày)</li>
            </ul>

            {result.partsWithoutTasks?.length > 0 && (
              <div className="alert alert-warning small">
                Part chưa đạt mục tiêu nhưng <strong>chưa có ải</strong> vì câu trong đề chưa gắn tag:
                {' '}
                {result.partsWithoutTasks.join(', ')}.
                Gắn tag câu hỏi (admin) rồi sinh plan lại.
              </div>
            )}

            <h5 className="mt-3">Chọn Part và ải ({result.partGroups?.length || 0})</h5>
            <PlanPartTaskList
              partGroups={result.partGroups || []}
              learningPlanId={result.learningPlanId}
              studyAction="link"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default GeneratePlanPage;
