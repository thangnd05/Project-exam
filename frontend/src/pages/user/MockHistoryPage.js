import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from '~/api/axiosClient';
import { getExamTypes } from '~/api/examTypeApi';
import { getEnhancedResult } from '~/api/enhancedResultApi';

function formatDate(s) {
  return s ? new Date(s).toLocaleString('vi-VN', { hour12: false }) : '—';
}

function formatDuration(seconds) {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function MockHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [examTypes, setExamTypes] = useState([]);
  const [examTypeFilter, setExamTypeFilter] = useState(searchParams.get('examTypeId') || '');
  const [allTests, setAllTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enhancedById, setEnhancedById] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    getExamTypes().then(setExamTypes).catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    axios.get('/api/user-tests/my')
      .then((res) => {
        if (!mounted) return;
        const arr = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const completed = arr
          .filter((u) => u.status === 'COMPLETED' && u.finishedAt)
          .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
        setAllTests(completed);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.message || err.message);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const tests = useMemo(() => {
    if (!examTypeFilter) return allTests;
    return allTests.filter((u) => u.examTypeId === examTypeFilter);
  }, [allTests, examTypeFilter]);

  const loadEnhanced = async (userTestId) => {
    if (enhancedById[userTestId]) return;
    setLoadingId(userTestId);
    try {
      const r = await getEnhancedResult(userTestId);
      setEnhancedById((prev) => ({ ...prev, [userTestId]: r.data }));
    } catch {
      setEnhancedById((prev) => ({ ...prev, [userTestId]: { error: true } }));
    } finally {
      setLoadingId(null);
    }
  };

  // Tự tải enhanced cho 3 lần gần nhất để vẽ trend nhỏ
  useEffect(() => {
    if (tests.length === 0) return;
    tests.slice(0, 3).forEach((t) => loadEnhanced(t.userTestId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tests]);

  // Trend (theo thứ tự thời gian tăng dần) cho các mock đã load enhanced
  const trend = useMemo(() => {
    return [...tests].reverse()
      .map((t) => {
        const e = enhancedById[t.userTestId];
        if (!e || e.error) return null;
        return {
          userTestId: t.userTestId,
          finishedAt: t.finishedAt,
          totalScore: e.totalScore ?? t.totalScore,
          readinessScore: e.readinessScore,
          isTargetMet: e.isTargetMet,
        };
      })
      .filter(Boolean);
  }, [tests, enhancedById]);

  const maxReadiness = Math.max(100, ...trend.map((p) => p.readinessScore || 0));

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="mb-0">Lịch sử bài thi</h2>
        <div className="d-flex gap-2">
          <Link to="/my-target/dashboard" className="btn btn-sm btn-outline-secondary">
            Tổng quan mục tiêu
          </Link>
          <Link to="/" className="btn btn-sm btn-outline-primary">
            Làm bài mới
          </Link>
        </div>
      </div>

      <div className="row g-2 align-items-end mb-3">
        <div className="col-md-4">
          <label className="form-label small text-muted mb-1">Lọc theo kỳ thi</label>
          <select
            className="form-select"
            value={examTypeFilter}
            onChange={(e) => {
              setExamTypeFilter(e.target.value);
              setSearchParams(e.target.value ? { examTypeId: e.target.value } : {});
            }}
          >
            <option value="">Tất cả</option>
            {examTypes.map((et) => (
              <option key={et.examTypeId} value={et.examTypeId}>{et.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-8">
          <p className="text-muted small mb-0">
            Hiển thị các bài đã COMPLETED. Nhấn <strong>Tải readiness</strong> để xem độ sẵn sàng từ enhanced result.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div>Đang tải...</div>}

      {!loading && tests.length === 0 && (
        <div className="alert alert-info">
          Bạn chưa có bài thi nào đã hoàn thành.{' '}
          <Link to="/">Làm bài đầu tiên →</Link>
        </div>
      )}

      {trend.length >= 2 && (
        <div className="card mb-4">
          <div className="card-header"><strong>Tiến triển readiness</strong> (sớm → muộn)</div>
          <div className="card-body">
            <div className="d-flex align-items-end gap-2" style={{ height: 160 }}>
              {trend.map((p) => {
                const h = (p.readinessScore || 0) / maxReadiness * 100;
                const bg = p.isTargetMet ? '#198754' : (p.readinessScore >= 70 ? '#0d6efd' : '#ffc107');
                return (
                  <div
                    key={p.userTestId}
                    className="d-flex flex-column align-items-center"
                    style={{ flex: 1, minWidth: 40 }}
                    title={`${formatDate(p.finishedAt)} · ${p.readinessScore}% · ${p.totalScore}đ`}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${h}%`,
                        background: bg,
                        borderRadius: 4,
                        transition: 'height .3s',
                      }}
                    />
                    <small className="text-muted mt-1">{p.readinessScore}%</small>
                    <small className="text-muted">{p.totalScore}đ</small>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tests.length > 0 && (
        <div className="card">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Hoàn thành</th>
                <th>Test ID</th>
                <th className="text-end">Score</th>
                <th className="text-end">Readiness</th>
                <th>Mục tiêu</th>
                <th>Thời gian</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t, idx) => {
                const e = enhancedById[t.userTestId];
                const enhancedLoaded = e && !e.error;
                return (
                  <tr key={t.userTestId}>
                    <td>{tests.length - idx}</td>
                    <td className="small">{formatDate(t.finishedAt)}</td>
                    <td className="small"><code>{t.testId?.slice(0, 8)}…</code></td>
                    <td className="text-end">
                      <strong>{enhancedLoaded ? e.totalScore : (t.totalScore ?? '—')}</strong>
                    </td>
                    <td className="text-end">
                      {enhancedLoaded ? `${e.readinessScore}%` : (
                        loadingId === t.userTestId ? '...' : (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0"
                            onClick={() => loadEnhanced(t.userTestId)}
                          >
                            Tải
                          </button>
                        )
                      )}
                    </td>
                    <td>
                      {enhancedLoaded ? (
                        e.isTargetMet === true ? (
                          <span className="badge bg-success">Đạt</span>
                        ) : e.isTargetMet === false ? (
                          <span className="badge bg-warning text-dark">Chưa đạt</span>
                        ) : (
                          <span className="text-muted small">Chưa set target</span>
                        )
                      ) : '—'}
                    </td>
                    <td className="small">{formatDuration(t.durationTaken)}</td>
                    <td>
                      <Link
                        to={`/tests/result/${t.userTestId}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        Chẩn đoán
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MockHistoryPage;
