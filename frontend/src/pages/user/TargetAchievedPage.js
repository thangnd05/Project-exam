import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from '~/api/axiosClient';
import { getExamTypes } from '~/api/examTypeApi';
import { getUserTarget } from '~/api/userTargetApi';
import { getEnhancedResult } from '~/api/enhancedResultApi';

function formatDate(s) {
  return s ? new Date(s).toLocaleString('vi-VN', { hour12: false }) : '—';
}

function suggestNextTarget(current) {
  if (current == null) return null;
  // Bước nhảy gợi ý: +50 cho TOEIC range, làm tròn 10
  const step = current < 600 ? 50 : 50;
  const next = Math.min(990, Math.round((current + step) / 10) * 10);
  return next > current ? next : current + 10;
}

function TargetAchievedPage() {
  const [searchParams] = useSearchParams();
  const [examTypes, setExamTypes] = useState([]);
  const [examTypeId, setExamTypeId] = useState(searchParams.get('examTypeId') || '');

  const [target, setTarget] = useState(null);
  const [latestMock, setLatestMock] = useState(null);
  const [enhanced, setEnhanced] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getExamTypes().then(setExamTypes).catch(() => {});
  }, []);

  useEffect(() => {
    if (!examTypeId && examTypes.length > 0) setExamTypeId(examTypes[0].examTypeId);
  }, [examTypes, examTypeId]);

  useEffect(() => {
    if (!examTypeId) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const t = await getUserTarget(examTypeId).catch(() => null);
        setTarget(t);

        const res = await axios.get('/api/user-tests/my');
        const arr = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const completed = arr
          .filter((u) => u.status === 'COMPLETED' && u.finishedAt)
          .filter((u) => !u.examTypeId || u.examTypeId === examTypeId)
          .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
        const latest = completed[0] || null;
        setLatestMock(latest);

        if (latest?.userTestId) {
          try {
            const r = await getEnhancedResult(latest.userTestId);
            setEnhanced(r.data);
          } catch {
            setEnhanced(null);
          }
        }
      } catch (err) {
        setError(err?.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [examTypeId]);

  const enhancedMatches =
    enhanced && (!enhanced.examTypeId || enhanced.examTypeId === examTypeId);
  // Ưu tiên cờ achievedAt từ BE; fallback infer từ mock.
  const isAchieved = Boolean(target?.achievedAt)
    || (enhancedMatches && enhanced?.isTargetMet === true);
  const nextSuggestion = useMemo(() => {
    if (!target?.targetScore) return null;
    return suggestNextTarget(target.targetScore);
  }, [target]);

  return (
    <div className="container py-4">
      <div className="mb-3">
        <Link to="/my-target/dashboard" className="btn btn-sm btn-outline-secondary">
          ← Tổng quan mục tiêu
        </Link>
      </div>

      <div className="mb-3" style={{ maxWidth: 360 }}>
        <label className="form-label small text-muted">Loại kỳ thi</label>
        <select
          className="form-select"
          value={examTypeId}
          onChange={(e) => setExamTypeId(e.target.value)}
        >
          {examTypes.map((et) => (
            <option key={et.examTypeId} value={et.examTypeId}>{et.name}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div>Đang tải...</div>}

      {!loading && !target?.hasTarget && (
        <div className="alert alert-info">
          Bạn chưa đặt mục tiêu cho kỳ thi này.{' '}
          <Link to={`/my-target?examTypeId=${examTypeId}`}>Đặt mục tiêu ngay →</Link>
        </div>
      )}

      {!loading && target?.hasTarget && !isAchieved && (
        <div className="alert alert-warning">
          Mock gần nhất chưa đạt mục tiêu {target.targetScore} điểm.{' '}
          {enhanced?.totalScore != null && (
            <>Điểm gần nhất: <strong>{enhanced.totalScore}</strong>.</>
          )}{' '}
          <Link to={`/my-target/dashboard?examTypeId=${examTypeId}`}>
            Xem tiến độ →
          </Link>
        </div>
      )}

      {!loading && isAchieved && (
        <>
          <div
            className="card border-success mb-4"
            style={{ background: 'linear-gradient(135deg, #d1e7dd, #f0fdf4)' }}
          >
            <div className="card-body text-center py-5">
              <div style={{ fontSize: 64 }}>🎉</div>
              <h1 className="display-5 fw-bold text-success">Bạn đã đạt mục tiêu!</h1>
              <p className="lead mb-2">
                Mục tiêu: <strong>{target.targetScore}</strong>
                {enhancedMatches && enhanced?.totalScore != null && (
                  <>
                    {' · '}Điểm đạt được:{' '}
                    <strong className="text-success">{enhanced.totalScore}</strong>
                    {' '}(+{enhanced.totalScore - target.targetScore})
                  </>
                )}
              </p>
              <p className="text-muted mb-0">
                {target.achievedAt
                  ? <>Đạt mục tiêu lúc: {formatDate(target.achievedAt)}</>
                  : <>Mock đạt mục tiêu: {formatDate(latestMock?.finishedAt)}</>}
              </p>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <h4>Mục tiêu tiếp theo</h4>
              <p className="text-muted">
                Bạn vừa hoàn thành chặng <strong>{target.targetScore}</strong>. Hãy đặt mục tiêu cao hơn để duy trì phong độ và mở khoá ngưỡng mới.
              </p>

              {nextSuggestion && (
                <div className="d-flex gap-3 flex-wrap mb-3">
                  <div className="card flex-fill" style={{ minWidth: 200 }}>
                    <div className="card-body">
                      <div className="small text-muted">Gợi ý</div>
                      <div style={{ fontSize: 28, fontWeight: 700 }}>{nextSuggestion}</div>
                      <Link
                        to={`/my-target?examTypeId=${examTypeId}&suggest=${nextSuggestion}`}
                        className="btn btn-sm btn-success mt-2"
                      >
                        Đặt {nextSuggestion}
                      </Link>
                    </div>
                  </div>
                  <div className="card flex-fill" style={{ minWidth: 200 }}>
                    <div className="card-body">
                      <div className="small text-muted">Vượt xa hơn</div>
                      <div style={{ fontSize: 28, fontWeight: 700 }}>
                        {Math.min(990, nextSuggestion + 50)}
                      </div>
                      <Link
                        to={`/my-target?examTypeId=${examTypeId}&suggest=${Math.min(990, nextSuggestion + 50)}`}
                        className="btn btn-sm btn-outline-success mt-2"
                      >
                        Thách thức
                      </Link>
                    </div>
                  </div>
                  <div className="card flex-fill" style={{ minWidth: 200 }}>
                    <div className="card-body">
                      <div className="small text-muted">Tự nhập</div>
                      <Link
                        to={`/my-target?examTypeId=${examTypeId}`}
                        className="btn btn-sm btn-outline-secondary mt-2"
                      >
                        Vào trang target
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-body">
              <h5>Tiếp theo có thể làm</h5>
              <ul className="mb-0">
                <li>
                  <Link to={`/my-target?examTypeId=${examTypeId}`}>Đặt mục tiêu mới</Link>{' '}
                  — chỉnh điểm + aim từng Part.
                </li>
                <li>
                  <Link to={`/learning-plans/compare?examTypeId=${examTypeId}`}>
                    Xem hành trình các plan
                  </Link>{' '}
                  — readiness #1 → #N qua từng mock.
                </li>
                <li>
                  <Link to="/my-target/mocks">Lịch sử bài thi</Link>{' '}
                  — biểu đồ readiness theo thời gian.
                </li>
                <li>
                  <Link to="/">Làm thêm bài</Link>{' '}
                  — duy trì phong độ, chờ thi thật.
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TargetAchievedPage;
