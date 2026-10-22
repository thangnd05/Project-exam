'use client';

import { Container } from 'react-bootstrap';
import classNamesBind from 'classnames/bind';
import { IoPodiumOutline, IoTrophyOutline } from 'react-icons/io5';

import type { TestRef } from '@/app/features/tests/testRef';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import TestPageHeader from '../_components/TestPageHeader';
import { useTestInfo } from '../_hooks/useTestInfo';
import styles from '../_components/TestPage.module.scss';
import { useTestLeaderboard } from './_hooks/useTestLeaderboard';

const cx = classNamesBind.bind(styles);
const ui = classNamesBind.bind(uiStyles);

const formatDuration = (totalSeconds: number | null) => {
  if (totalSeconds == null) return '—';
  const sec = Math.max(0, Math.floor(Number(totalSeconds)));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

const formatScore = (score: number) => (Number.isInteger(score) ? String(score) : score.toFixed(1));

const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

type Row = {
  id: string;
  rank: number;
  displayName: string;
  score: number;
  durationTaken: number | null;
  isMe: boolean;
};

function UserCell({ row }: { row: Row }) {
  return (
    <span className={cx('user')}>
      <span className={cx('avatar')} aria-hidden="true">
        {initialOf(row.displayName)}
      </span>
      <span className={cx('userName')}>{row.displayName}</span>
      {row.isMe && <span className={ui('pill', 'pillBrand')}>Bạn</span>}
    </span>
  );
}

// testRef do page server tra từ slug trên URL (/tests/aws-dop-c02-test-1/leaderboard) rồi truyền xuống.
function TestLeaderboard({ testRef }: { testRef: TestRef }) {
  const { test } = useTestInfo(testRef.testId);
  const { rawRows, me, totalParticipants, errorMessage, isLoading: loading } = useTestLeaderboard(
    testRef.testId,
  );

  const rows: Row[] = rawRows.map((entry, index) => ({
    id: entry.userTestId ?? entry.userId ?? `row-${index}`,
    rank: index + 1,
    displayName:
      entry.fullName ||
      entry.userName ||
      entry.username ||
      entry.displayName ||
      (entry.userId ? `User ${entry.userId}` : 'Người dùng'),
    score: Number(entry.totalScore ?? entry.score ?? 0),
    durationTaken: typeof entry.durationTaken === 'number' ? entry.durationTaken : null,
    isMe: me != null && entry.userTestId === me.userTestId,
  }));
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  const renderBody = () => {
    if (loading) {
      return (
        <>
          <div className={cx('skeleton')} aria-hidden="true" />
          <div className={cx('skeleton', 'skeletonTall')} aria-hidden="true" />
        </>
      );
    }

    if (errorMessage) {
      return (
        <div className={ui('notice', 'noticeWarning')}>
          <span>{errorMessage}</span>
        </div>
      );
    }

    if (rows.length === 0) {
      return (
        <div className={ui('empty')}>
          <IoPodiumOutline className={ui('emptyIcon')} aria-hidden="true" />
          <h2>Chưa có ai trên bảng xếp hạng</h2>
          <p>Làm bài và nộp bài để trở thành người đầu tiên.</p>
        </div>
      );
    }

    return (
      <>
        {me ? (
          <section className={cx('myRank')} aria-label="Hạng của bạn">
            <div className={cx('myRankMain')}>
              <span className={ui('eyebrow')}>Hạng của bạn</span>
              <span className={cx('myRankValue')}>
                #{me.rank}
                <small>/ {totalParticipants}</small>
              </span>
            </div>
            <div className={cx('myRankStats')}>
              <div className={cx('myRankStat')}>
                <span className={ui('eyebrow')}>Điểm</span>
                <strong>{formatScore(Number(me.totalScore ?? 0))}</strong>
              </div>
              <div className={cx('myRankStat')}>
                <span className={ui('eyebrow')}>Thời gian</span>
                <strong>{formatDuration(me.durationTaken ?? null)}</strong>
              </div>
            </div>
            <span className={cx('myRankHint')}>Mỗi người tính lần điểm cao nhất; bằng điểm thì ai làm nhanh hơn xếp trên.</span>
          </section>
        ) : (
          <div className={ui('notice', 'noticeInfo')}>
            <span>Bạn chưa có kết quả trên bảng này. Làm bài và nộp bài để được xếp hạng.</span>
          </div>
        )}

        <div className={cx('podium')}>
          {podium.map((row) => (
            <article key={row.id} className={cx('podiumCard', `medal${row.rank}`, { mine: row.isMe })}>
              <div className={cx('podiumTop')}>
                <span className={cx('podiumRank')}>
                  <IoTrophyOutline aria-hidden="true" />
                  Hạng {row.rank}
                </span>
              </div>
              <UserCell row={row} />
              <div className={cx('podiumStats')}>
                <span className={cx('podiumScore')}>{formatScore(row.score)}</span>
                <span className={cx('mono', 'dim')}>{formatDuration(row.durationTaken)}</span>
              </div>
            </article>
          ))}
        </div>

        {rest.length > 0 && (
          <section aria-labelledby="leaderboard-title">
            <div className={cx('sectionHead')}>
              <h2 id="leaderboard-title" className={cx('sectionTitle')}>
                Bảng xếp hạng
              </h2>
              <span className={cx('sectionCount')}>{totalParticipants}</span>
              {totalParticipants > rows.length && (
                <span className={cx('sectionNote')}>
                  Hiển thị top {rows.length} / {totalParticipants}
                </span>
              )}
            </div>

            <div className={cx('tableWrap')}>
              <table className={cx('table')}>
                <thead>
                  <tr>
                    <th>Hạng</th>
                    <th>Người dùng</th>
                    <th className={cx('right')}>Điểm</th>
                    <th className={cx('right')}>Thời gian làm</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((row) => (
                    <tr key={row.id} className={cx({ myRow: row.isMe })}>
                      <td>
                        <span className={cx('rank')}>#{row.rank}</span>
                      </td>
                      <td>
                        <UserCell row={row} />
                      </td>
                      <td className={cx('right')}>
                        <span className={cx('score')}>{formatScore(row.score)}</span>
                      </td>
                      <td className={cx('right', 'mono', 'dim')}>{formatDuration(row.durationTaken)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </>
    );
  };

  return (
    <div className={cx('wrapper')}>
      <Container>
        <TestPageHeader testRef={testRef} test={test} active="leaderboard" />
        {renderBody()}
      </Container>
    </div>
  );
}

export default TestLeaderboard;
