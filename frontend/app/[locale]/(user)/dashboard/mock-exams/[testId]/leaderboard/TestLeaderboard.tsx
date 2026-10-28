'use client';

import { Container } from 'react-bootstrap';
import classNamesBind from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { ChartNoAxesColumn, Trophy } from 'lucide-react';

import type { TestRef } from '@/app/features/tests/testRef';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import TestPageHeader from '../_components/TestPageHeader';
import { useTestInfo } from '../_hooks/useTestInfo';
import styles from '../_components/TestPage.module.scss';
import { useTestLeaderboard } from './_hooks/useTestLeaderboard';
import { formatDuration, formatScore } from '../_lib/formatAttempt';

const cx = classNamesBind.bind(styles);
const ui = classNamesBind.bind(uiStyles);

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
  const t = useTranslations('TestTaking.leaderboard');
  return (
    <span className={cx('user')}>
      <span className={cx('avatar')} aria-hidden="true">
        {initialOf(row.displayName)}
      </span>
      <span className={cx('userName')}>{row.displayName}</span>
      {row.isMe && <span className={ui('pill', 'pillBrand')}>{t('you')}</span>}
    </span>
  );
}

// testRef do page server tra từ slug trên URL (/dashboard/mock-exams/aws-dop-c02-test-1/leaderboard) rồi truyền xuống.
function TestLeaderboard({ testRef }: { testRef: TestRef }) {
  const t = useTranslations('TestTaking.leaderboard');
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
      (entry.userId ? t('userFallback', { id: entry.userId }) : t('anonymous')),
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
          <ChartNoAxesColumn size="1em" className={ui('emptyIcon')} aria-hidden="true" />
          <h2>{t('empty.title')}</h2>
          <p>{t('empty.desc')}</p>
        </div>
      );
    }

    return (
      <>
        {me ? (
          <section className={cx('myRank')} aria-label={t('myRank')}>
            <div className={cx('myRankMain')}>
              <span className={ui('eyebrow')}>{t('myRank')}</span>
              <span className={cx('myRankValue')}>
                #{me.rank}
                <small>/ {totalParticipants}</small>
              </span>
            </div>
            <div className={cx('myRankStats')}>
              <div className={cx('myRankStat')}>
                <span className={ui('eyebrow')}>{t('score')}</span>
                <strong>{formatScore(Number(me.totalScore ?? 0))}</strong>
              </div>
              <div className={cx('myRankStat')}>
                <span className={ui('eyebrow')}>{t('time')}</span>
                <strong>{formatDuration(me.durationTaken ?? null)}</strong>
              </div>
            </div>
            <span className={cx('myRankHint')}>{t('rankingHint')}</span>
          </section>
        ) : (
          <div className={ui('notice', 'noticeInfo')}>
            <span>{t('notRanked')}</span>
          </div>
        )}

        <div className={cx('podium')}>
          {podium.map((row) => (
            <article key={row.id} className={cx('podiumCard', `medal${row.rank}`, { mine: row.isMe })}>
              <div className={cx('podiumTop')}>
                <span className={cx('podiumRank')}>
                  <Trophy size="1em" aria-hidden="true" />
                  {t('rankLabel', { rank: row.rank })}
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
                {t('title')}
              </h2>
              <span className={cx('sectionCount')}>{totalParticipants}</span>
              {totalParticipants > rows.length && (
                <span className={cx('sectionNote')}>
                  {t('showingTop', { shown: rows.length, total: totalParticipants })}
                </span>
              )}
            </div>

            <div className={cx('tableWrap')}>
              <table className={cx('table')}>
                <thead>
                  <tr>
                    <th>{t('columns.rank')}</th>
                    <th>{t('columns.user')}</th>
                    <th className={cx('right')}>{t('score')}</th>
                    <th className={cx('right')}>{t('columns.duration')}</th>
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
