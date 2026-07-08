import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { getEnhancedResult } from '~/api/enhancedResultApi';
import Pagination from '~/components/common/Pagination/Pagination';
import {
  formatDateTime24 as formatDate,
  formatDayMonth,
  formatHourMinute24,
} from '~/utils/format-date-time';
import MockHistoryCharts from './components/MockHistoryCharts';
import { CHART_FETCH_LIMIT, useMockHistory } from './hooks/useMockHistory';
import styles from '../../learning-plan/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

const PAGE_SIZE = 10;

function formatDuration(seconds) {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function MockHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [examTypeFilter, setExamTypeFilter] = useState(searchParams.get('examTypeId') || '');
  const [page, setPage] = useState(0);
  const [enhancedById, setEnhancedById] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);

  const {
    examTypes,
    chartTests,
    tablePage,
    isLoading: loading,
    error,
    targetScore,
  } = useMockHistory(examTypeFilter, { page, size: PAGE_SIZE });

  const tableRows = tablePage?.content ?? [];
  const totalElements = tablePage?.totalElements ?? 0;
  const totalPages = tablePage?.totalPages ?? 0;
  const currentPage = tablePage?.currentPage ?? page;

  const examTypeName = useMemo(
    () => examTypes.find((et) => et.examTypeId === examTypeFilter)?.name || '',
    [examTypes, examTypeFilter],
  );

  const changeExamType = (value) => {
    setExamTypeFilter(value);
    setPage(0);
    setSearchParams(value ? { examTypeId: value } : {});
  };

  // Nạp readiness (enhanced result) cho các bài trong biểu đồ. BE đã loại Quick
  // Challenge nên mọi bài ở đây đều có điểm tổng chuẩn.
  const chartTestIds = useMemo(
    () => chartTests.map((t) => t.userTestId).join(','),
    [chartTests],
  );

  useEffect(() => {
    if (chartTests.length === 0) {
      return undefined;
    }

    let cancelled = false;
    const missing = chartTests.filter((t) => !enhancedById[t.userTestId]);

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
    const chronological = [...chartTests].reverse();

    // Đếm số bài mỗi ngày để phân biệt các lần thi trùng ngày bằng giờ.
    const dayCounts = chronological.reduce((acc, t) => {
      const day = formatDayMonth(t.finishedAt);
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    return chronological.map((t, idx) => {
      const e = enhancedById[t.userTestId];
      const enhancedLoaded = e && !e.error;
      const totalScore = enhancedLoaded ? (e.totalScore ?? t.totalScore ?? null) : (t.totalScore ?? null);
      const readinessScore = enhancedLoaded ? e.readinessScore : null;

      const day = formatDayMonth(t.finishedAt);
      const time = formatHourMinute24(t.finishedAt);
      const dateLabel = dayCounts[day] > 1 && time ? `${day} ${time}` : day;

      return {
        key: t.userTestId,
        order: idx + 1,
        dateLabel,
        fullDate: formatDate(t.finishedAt),
        totalScore,
        readinessScore,
        isTargetMet: enhancedLoaded ? e.isTargetMet : null,
      };
    });
  }, [chartTests, enhancedById]);

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
            onChange={(e) => changeExamType(e.target.value)}
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
          Chỉ tính bài làm đề đầy đủ (bỏ luyện tập theo Part & Quick Challenge). Biểu đồ hiển thị
          tối đa {CHART_FETCH_LIMIT} bài gần nhất (cũ → mới); bảng phân trang bên dưới.
        </p>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}
      {loading && <div className={cx('loading')}>Đang tải...</div>}

      {!loading && totalElements === 0 && (
        <div className={cx('alert', 'alertInfo')}>
          <span>Bạn chưa có bài thi đầy đủ nào để thống kê.</span>
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

      {tableRows.length > 0 && (
        <>
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
                {tableRows.map((t, idx) => {
                  const e = enhancedById[t.userTestId];
                  const enhancedLoaded = e && !e.error;
                  return (
                    <tr key={t.userTestId}>
                      <td>{totalElements - (currentPage * PAGE_SIZE + idx)}</td>
                      <td className={cx('small')}>{formatDate(t.finishedAt)}</td>
                      <td>
                        <code className={cx('code')}>{t.testId?.slice(0, 8)}…</code>
                      </td>
                      <td className={cx('right')}>
                        <strong>
                          {(enhancedLoaded ? e.totalScore : t.totalScore) ?? '—'}
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

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

export default MockHistoryPage;
