'use client';

import Link from 'next/link';
import { Container } from 'react-bootstrap';
import classNamesBind from 'classnames/bind';
import { FiArrowRight } from 'react-icons/fi';
import { IoDocumentTextOutline } from 'react-icons/io5';

import { UserTestStatus } from '@/app/enums';
import { isPracticeAttempt } from '@/app/features/learning-plans/planLabels';
import type { TestRef } from '@/app/features/tests/testRef';
import type { UserTestResponse } from '@/app/types';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import TestPageHeader from '../_components/TestPageHeader';
import styles from '../_components/TestPage.module.scss';
import { useTestHistory } from './_hooks/useTestHistory';

const cx = classNamesBind.bind(styles);
const ui = classNamesBind.bind(uiStyles);

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN', {
    hour12: false,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (seconds?: number | null) => {
  if (seconds == null) return '—';
  const sec = Math.max(0, Math.floor(seconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

const formatScore = (score?: number | null) => {
  if (score == null) return '—';
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
};

const STATUS: Record<string, { label: string; tone: string | null }> = {
  [UserTestStatus.COMPLETED]: { label: 'Hoàn thành', tone: 'pillSuccess' },
  [UserTestStatus.IN_PROGRESS]: { label: 'Đang làm', tone: 'pillBrand' },
};

function summarize(attempts: UserTestResponse[]) {
  // API trả lượt mới nhất trước.
  const completed = attempts.filter((a) => a.status === UserTestStatus.COMPLETED && a.totalScore != null);
  const scores = completed.map((a) => a.totalScore as number);
  const durations = completed.map((a) => a.durationTaken).filter((d): d is number => d != null);
  const latest = completed[0];
  const previous = completed[1];
  return {
    completedCount: completed.length,
    best: scores.length ? Math.max(...scores) : null,
    latest: latest?.totalScore ?? null,
    delta: latest && previous ? (latest.totalScore as number) - (previous.totalScore as number) : null,
    avgDuration: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
  };
}

// testRef do page server tra từ slug trên URL (/tests/aws-dop-c02-test-1/history) rồi truyền xuống.
function TestHistory({ testRef }: { testRef: TestRef }) {
  const { attempts, testInfo, isLoading } = useTestHistory(testRef.testId);
  const summary = summarize(attempts);

  const renderBody = () => {
    if (isLoading) {
      return (
        <>
          <div className={cx('skeleton')} aria-hidden="true" />
          <div className={cx('skeleton', 'skeletonTall')} aria-hidden="true" />
        </>
      );
    }

    if (attempts.length === 0) {
      return (
        <div className={ui('empty')}>
          <IoDocumentTextOutline className={ui('emptyIcon')} aria-hidden="true" />
          <h2>Chưa có lần làm bài nào</h2>
          <p>Bấm &quot;Bắt đầu làm bài&quot; ở trên. Mỗi lần nộp bài sẽ được lưu lại ở đây để bạn so sánh.</p>
        </div>
      );
    }

    return (
      <>
        <section className={cx('stats')} aria-label="Tổng quan">
          <div className={cx('stat')}>
            <span className={ui('eyebrow')}>Lượt đã làm</span>
            <span className={cx('statValue')}>{attempts.length}</span>
            <span className={cx('statMeta')}>{summary.completedCount} lượt hoàn thành</span>
          </div>
          <div className={cx('stat')}>
            <span className={ui('eyebrow')}>Điểm cao nhất</span>
            <span className={cx('statValue')}>{formatScore(summary.best)}</span>
          </div>
          <div className={cx('stat')}>
            <span className={ui('eyebrow')}>Lần gần nhất</span>
            <span className={cx('statValue')}>{formatScore(summary.latest)}</span>
            {summary.delta != null && (
              <span className={cx('statMeta', summary.delta > 0 ? 'up' : summary.delta < 0 ? 'down' : null)}>
                {summary.delta > 0 ? '+' : ''}
                {formatScore(summary.delta)} so với lần trước
              </span>
            )}
          </div>
          <div className={cx('stat')}>
            <span className={ui('eyebrow')}>Thời gian TB</span>
            <span className={cx('statValue')}>{formatDuration(summary.avgDuration)}</span>
          </div>
        </section>

        <section aria-labelledby="attempts-title">
          <div className={cx('sectionHead')}>
            <h2 id="attempts-title" className={cx('sectionTitle')}>
              Các lần làm bài
            </h2>
            <span className={cx('sectionCount')}>{attempts.length}</span>
          </div>

          <div className={cx('tableWrap')}>
            <table className={cx('table')}>
              <thead>
                <tr>
                  <th>Lần</th>
                  <th>Bắt đầu</th>
                  <th>Nộp bài</th>
                  <th>Thời gian làm</th>
                  <th className={cx('right')}>Điểm</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a, i) => {
                  const status = STATUS[a.status as string] ?? { label: 'Hết hạn', tone: 'pillWarning' };
                  const isBest =
                    a.status === UserTestStatus.COMPLETED &&
                    summary.completedCount > 1 &&
                    a.totalScore === summary.best;
                  return (
                    <tr key={a.userTestId}>
                      <td>
                        <span className={cx('attemptCell')}>
                          <span className={cx('rank')}>#{attempts.length - i}</span>
                          {isPracticeAttempt(a) && <span className={ui('pill')}>Luyện theo phần</span>}
                        </span>
                      </td>
                      <td className={cx('mono', 'dim')}>{formatDateTime(a.startedAt)}</td>
                      <td className={cx('mono', 'dim')}>{formatDateTime(a.finishedAt)}</td>
                      <td className={cx('mono', 'dim')}>{formatDuration(a.durationTaken)}</td>
                      <td className={cx('right')}>
                        <span className={cx('attemptCell', 'attemptCellEnd')}>
                          {isBest && <span className={ui('pill', 'pillSuccess')}>Cao nhất</span>}
                          <span className={cx('score')}>{formatScore(a.totalScore)}</span>
                        </span>
                      </td>
                      <td>
                        <span className={ui('pill', status.tone)}>{status.label}</span>
                      </td>
                      <td className={cx('right')}>
                        {a.status === UserTestStatus.COMPLETED ? (
                          <Link href={`/tests/result/${a.userTestId}`} className={ui('btnSecondary', 'btnSm')}>
                            Xem kết quả
                            <FiArrowRight aria-hidden="true" />
                          </Link>
                        ) : (
                          <span className={cx('dim')}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  };

  return (
    <div className={cx('wrapper')}>
      <Container>
        <TestPageHeader testRef={testRef} test={testInfo} active="history" />
        {renderBody()}
      </Container>
    </div>
  );
}

export default TestHistory;
