import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import axios from '~/api/axiosClient';
import { getExamTypes } from '~/api/examTypeApi';
import { getEnhancedResult } from '~/api/enhancedResultApi';
import styles from '../PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

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

  useEffect(() => {
    if (tests.length === 0) return;
    tests.slice(0, 3).forEach((t) => loadEnhanced(t.userTestId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tests]);

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
    <div className={cx('wrapper')}>
      <div className={cx('headerBar')}>
        <h2 className={cx('title')}>Lịch sử bài thi</h2>
        <div className={cx('actionBar')}>
          <Link to="/my-target/dashboard" className={cx('btn', 'btnOutline', 'btnSm')}>
            Tổng quan mục tiêu
          </Link>
          <Link to="/" className={cx('btn', 'btnPrimary', 'btnSm')}>
            Làm bài mới
          </Link>
        </div>
      </div>

      <div className={cx('filterRow')}>
        <div className={cx('fieldGroup')}>
          <label className={cx('fieldLabel')}>Lọc theo kỳ thi</label>
          <select
            className={cx('select')}
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
        <p className={cx('filterHint')}>
          Hiển thị các bài đã COMPLETED. Nhấn <strong>Tải</strong> để xem readiness của 1 mock.
        </p>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}
      {loading && <div className={cx('loading')}>Đang tải...</div>}

      {!loading && tests.length === 0 && (
        <div className={cx('alert', 'alertInfo')}>
          <span>Bạn chưa có bài thi nào đã hoàn thành.</span>
          <Link to="/" className={cx('btn', 'btnPrimary', 'btnSm')}>Làm bài đầu tiên</Link>
        </div>
      )}

      {trend.length >= 2 && (
        <div className={cx('card')}>
          <div className={cx('cardHeader')}>
            Tiến triển readiness (sớm → muộn)
          </div>
          <div className={cx('cardBody')}>
            <div className={cx('barChart')}>
              {trend.map((p) => {
                const h = ((p.readinessScore || 0) / maxReadiness) * 100;
                const variant = p.isTargetMet
                  ? 'success'
                  : (p.readinessScore >= 70 ? '' : 'warning');
                return (
                  <div
                    key={p.userTestId}
                    className={cx('barColumn')}
                    title={`${formatDate(p.finishedAt)} · ${p.readinessScore}% · ${p.totalScore}đ`}
                  >
                    <span className={cx('barValue')}>{p.readinessScore}%</span>
                    <div className={cx('barBar', variant)} style={{ height: `${h}%` }} />
                    <span className={cx('barLabel')}>{p.totalScore}đ</span>
                  </div>
                );
              })}
            </div>
            <p className={cx('chartNote')}>
              Cột xanh lá = mock đạt target · xanh dương = readiness ≥ 70% · vàng = dưới ngưỡng.
            </p>
          </div>
        </div>
      )}

      {tests.length > 0 && (
        <div className={cx('tableWrapper')}>
          <table className={cx('table')}>
            <thead>
              <tr>
                <th>#</th>
                <th>Hoàn thành</th>
                <th>Test ID</th>
                <th className={cx('right')}>Score</th>
                <th className={cx('right')}>Readiness</th>
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
                    <td className={cx('small')}>{formatDate(t.finishedAt)}</td>
                    <td><code className={cx('code')}>{t.testId?.slice(0, 8)}…</code></td>
                    <td className={cx('right')}>
                      <strong>{enhancedLoaded ? e.totalScore : (t.totalScore ?? '—')}</strong>
                    </td>
                    <td className={cx('right')}>
                      {enhancedLoaded ? `${e.readinessScore}%` : (
                        loadingId === t.userTestId ? '...' : (
                          <button
                            type="button"
                            className={cx('btn', 'btnGhost', 'btnSm')}
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
                          <span className={cx('badge', 'badgeSuccess')}>Đạt</span>
                        ) : e.isTargetMet === false ? (
                          <span className={cx('badge', 'badgeWarning')}>Chưa đạt</span>
                        ) : (
                          <span className={cx('badge', 'badgeMuted')}>Chưa set</span>
                        )
                      ) : '—'}
                    </td>
                    <td className={cx('small')}>{formatDuration(t.durationTaken)}</td>
                    <td>
                      <Link
                        to={`/tests/result/${t.userTestId}`}
                        className={cx('btn', 'btnOutline', 'btnSm')}
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
