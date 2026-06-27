import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { getMyUserTests } from '~/api/userTestApi';
import { getExamTypes } from '~/api/examTypeApi';
import { getEnhancedResult } from '~/api/enhancedResultApi';
import { getUserTarget } from '~/api/userTargetApi';
import { filterCompletedTests } from '~/utils/userTests';
import { formatDateTime24 as formatDate, formatDayMonth } from '~/utils/format-date-time';
import MockHistoryCharts from './components/MockHistoryCharts';
import styles from '../../learning-plan/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

const CHART_FETCH_LIMIT = 25;

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
  const [chartLoading, setChartLoading] = useState(false);
  const [targetScore, setTargetScore] = useState(null);

  useEffect(() => {
    getExamTypes().then(setExamTypes).catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    getMyUserTests()
      .then((arr0) => {
        if (!mounted) return;
        setAllTests(filterCompletedTests(arr0));
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.message || err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const tests = useMemo(() => {
    if (!examTypeFilter) return allTests;
    return allTests.filter((u) => u.examTypeId === examTypeFilter);
  }, [allTests, examTypeFilter]);

  const examTypeName = useMemo(
    () => examTypes.find((et) => et.examTypeId === examTypeFilter)?.name || '',
    [examTypes, examTypeFilter],
  );

  useEffect(() => {
    if (!examTypeFilter) {
      setTargetScore(null);
      return;
    }
    let mounted = true;
    getUserTarget(examTypeFilter)
      .then((data) => {
        if (!mounted) return;
        setTargetScore(data.hasTarget ? data.targetScore : null);
      })
      .catch(() => {
        if (mounted) setTargetScore(null);
      });
    return () => {
      mounted = false;
    };
  }, [examTypeFilter]);

  const testsForChart = useMemo(
    () => tests.slice(0, CHART_FETCH_LIMIT),
    [tests],
  );

  const chartTestIds = useMemo(
    () => testsForChart.map((t) => t.userTestId).join(','),
    [testsForChart],
  );

  useEffect(() => {
    if (testsForChart.length === 0) {
      return undefined;
    }

    let cancelled = false;
    const missing = testsForChart.filter((t) => !enhancedById[t.userTestId]);

    if (missing.length === 0) {
      return undefined;
    }

    setChartLoading(true);

    (async () => {
      const batches = await Promise.all(
        missing.map(async (t) => {
          try {
            const r = await getEnhancedResult(t.userTestId);
            return { userTestId: t.userTestId, data: r.data };
          } catch {
            return { userTestId: t.userTestId, data: { error: true } };
          }
        }),
      );

      if (cancelled) return;

      setEnhancedById((prev) => {
        const next = { ...prev };
        batches.forEach((item) => {
          next[item.userTestId] = item.data;
        });
        return next;
      });
      setChartLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartTestIds]);

  const chartData = useMemo(() => {
    const chronological = [...testsForChart].reverse();
    return chronological.map((t, idx) => {
      const e = enhancedById[t.userTestId];
      const enhancedLoaded = e && !e.error;
      const totalScore =
        (enhancedLoaded ? e.totalScore : null) ?? t.totalScore ?? null;
      const readinessScore = enhancedLoaded ? e.readinessScore : null;

      return {
        key: t.userTestId,
        order: idx + 1,
        dateLabel: formatDayMonth(t.finishedAt),
        fullDate: formatDate(t.finishedAt),
        totalScore,
        readinessScore,
        isTargetMet: enhancedLoaded ? e.isTargetMet : null,
      };
    });
  }, [testsForChart, enhancedById]);

  const loadEnhanced = useCallback(async (userTestId) => {
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
  }, [enhancedById]);

  const showCharts = !loading && chartData.length > 0;

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
              <option key={et.examTypeId} value={et.examTypeId}>
                {et.name}
              </option>
            ))}
          </select>
        </div>
        <p className={cx('filterHint')}>
          Biểu đồ hiển thị tối đa {CHART_FETCH_LIMIT} bài gần nhất (cũ → mới).
          Bảng bên dưới liệt kê đầy đủ — nhấn <strong>Tải</strong> nếu thiếu readiness.
        </p>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}
      {loading && <div className={cx('loading')}>Đang tải...</div>}

      {!loading && tests.length === 0 && (
        <div className={cx('alert', 'alertInfo')}>
          <span>Bạn chưa có bài thi nào đã hoàn thành.</span>
          <Link to="/" className={cx('btn', 'btnPrimary', 'btnSm')}>
            Làm bài đầu tiên
          </Link>
        </div>
      )}

      {showCharts && (
        <MockHistoryCharts
          chartData={chartData}
          targetScore={targetScore}
          loading={chartLoading}
          examTypeName={examTypeName || (examTypeFilter ? '' : 'Tất cả kỳ thi')}
        />
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
                    <td>
                      <code className={cx('code')}>{t.testId?.slice(0, 8)}…</code>
                    </td>
                    <td className={cx('right')}>
                      <strong>
                        {enhancedLoaded ? e.totalScore : t.totalScore ?? '—'}
                      </strong>
                    </td>
                    <td className={cx('right')}>
                      {enhancedLoaded ? (
                        `${e.readinessScore}%`
                      ) : loadingId === t.userTestId ? (
                        '...'
                      ) : (
                        <button
                          type="button"
                          className={cx('btn', 'btnGhost', 'btnSm')}
                          onClick={() => loadEnhanced(t.userTestId)}
                        >
                          Tải
                        </button>
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
                      ) : (
                        '—'
                      )}
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
