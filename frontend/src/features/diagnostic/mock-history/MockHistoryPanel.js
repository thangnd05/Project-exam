'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import { ChevronDown } from 'lucide-react';
import { getEnhancedResult } from '~/shared/api/enhancedResultApi';
import Pagination from '~/shared/ui/Pagination/Pagination';
import {
  formatDateTime24 as formatDate,
  formatDayMonth,
  formatHourMinute24,
} from '~/shared/utils/format-date-time';
import MockHistoryCharts from './components/MockHistoryCharts';
import { useMockHistory } from '~/features/diagnostic/mock-history/hooks/useMockHistory';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

const PAGE_SIZE = 10;

const enhancedResultKeys = {
  detail: (userTestId) => ['enhanced-result', userTestId],
};

function formatDuration(seconds) {
  if (seconds == null) return '—';
  const sec = Math.max(0, Math.floor(Number(seconds)));
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const remSeconds = sec % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m ${remSeconds}s`;
}

function MockHistoryPanel({ examTypeId, examTypeName }) {
  const [tableOpen, setTableOpen] = useState(false);
  const [page, setPage] = useState(0);

  const [requestedIds, setRequestedIds] = useState(() => new Set());

  const {
    chartTests,
    tablePage,
    isLoading: loading,
    error,
    targetScore,
  } = useMockHistory(examTypeId || '', { page, size: PAGE_SIZE });

  const tableRows = tablePage?.content ?? [];
  const totalElements = tablePage?.totalElements ?? 0;
  const totalPages = tablePage?.totalPages ?? 0;
  const currentPage = tablePage?.currentPage ?? page;

  const enhancedIds = useMemo(() => {
    const ids = new Set(chartTests.map((t) => t.userTestId));
    requestedIds.forEach((id) => ids.add(id));
    return [...ids];
  }, [chartTests, requestedIds]);

  const enhancedQueries = useQueries({
    queries: enhancedIds.map((userTestId) => ({
      queryKey: enhancedResultKeys.detail(userTestId),
      queryFn: () => getEnhancedResult(userTestId).then((r) => r.data),
      staleTime: Infinity,
    })),
  });

  const enhancedQueryById = {};
  enhancedIds.forEach((id, i) => {
    enhancedQueryById[id] = enhancedQueries[i];
  });

  const enhancedSignature = enhancedIds
    .map((id, i) => {
      const q = enhancedQueries[i];
      return `${id}:${q?.isError ? 'e' : q?.data !== undefined ? 'd' : 'p'}`;
    })
    .join('|');

  const enhancedById = useMemo(() => {
    const map = {};
    enhancedIds.forEach((id, i) => {
      const q = enhancedQueries[i];
      if (!q) return;
      if (q.isError) map[id] = { error: true };
      else if (q.data !== undefined) map[id] = q.data;
    });
    return map;

  }, [enhancedSignature]);

  const chartLoading = chartTests.some((t) => {
    const q = enhancedQueryById[t.userTestId];
    return q ? q.isLoading : true;
  });

  const chartData = useMemo(() => {
    const chronological = [...chartTests].reverse();

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

  const loadEnhanced = (userTestId) => {

    setRequestedIds((prev) => {
      if (prev.has(userTestId)) return prev;
      const next = new Set(prev);
      next.add(userTestId);
      return next;
    });
  };

  const showCharts = !loading && chartData.length > 0;

  return (
    <div className={cx('card')}>
      <div className={cx('cardHeader')}>Tiến triển qua các bài đã làm</div>

      <div className={cx('cardBody')}>
        {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}
        {loading && <div className={cx('loading')}>Đang tải...</div>}

        {!loading && totalElements === 0 && (
          <div className={cx('alert', 'alertInfo')} style={{ marginBottom: 0 }}>
            <span>Chưa có bài thi đầy đủ nào để thống kê.</span>
            <Link href="/" className={cx('btn', 'btnPrimary', 'btnSm')}>
              Làm bài đầu tiên
            </Link>
          </div>
        )}

        {showCharts && (
          <MockHistoryCharts
            chartData={chartData}
            targetScore={targetScore}
            loading={chartLoading}
            examTypeName={examTypeName || ''}
          />
        )}

        {totalElements > 0 && (
          <button
            type="button"
            className={cx('btn', 'btnOutline', 'btnSm', 'historyToggle')}
            onClick={() => setTableOpen((prev) => !prev)}
            aria-expanded={tableOpen}
          >
            <ChevronDown
              size={16}
              className={cx('historyToggleIcon', { historyToggleIconOpen: tableOpen })}
            />
            {tableOpen ? 'Ẩn bảng chi tiết' : `Xem bảng chi tiết (${totalElements} bài)`}
          </button>
        )}

        {tableOpen && tableRows.length > 0 && (
          <>
            <div className={cx('tableWrapper')} style={{ marginTop: '1.4rem' }}>
              <table className={cx('table')}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Hoàn thành</th>
                    <th>Tên bài kiểm tra</th>
                    <th className={cx('right')}>Score</th>
                    <th className={cx('right')}>Độ sẵn sàng</th>
                    <th>Mục tiêu</th>
                    <th>Thời gian</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((t, idx) => {
                    const e = enhancedById[t.userTestId];
                    const enhancedLoaded = e && !e.error;
                    const rowQuery = enhancedQueryById[t.userTestId];
                    const rowLoading = !enhancedLoaded && !!rowQuery?.isFetching;
                    return (
                      <tr key={t.userTestId}>
                        <td>{totalElements - (currentPage * PAGE_SIZE + idx)}</td>
                        <td className={cx('small')}>{formatDate(t.finishedAt)}</td>
                        <td>{t.testTitle || '—'}</td>
                        <td className={cx('right')}>
                          <strong>
                            {(enhancedLoaded ? e.totalScore : t.totalScore) ?? '—'}
                          </strong>
                        </td>
                        <td className={cx('right')}>
                          {enhancedLoaded ? (
                            `${e.readinessScore}%`
                          ) : rowLoading ? (
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
                            href={`/tests/result/${t.userTestId}`}
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
    </div>
  );
}

export default MockHistoryPanel;
