'use client';

import Link from '@/app/i18n/navigation';
import { Container } from 'react-bootstrap';
import classNamesBind from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { ArrowRight, FileText } from 'lucide-react';

import { UserTestStatus } from '@/app/enums';
import { isPracticeAttempt } from '@/app/features/learning-plans/planLabels';
import type { TestRef } from '@/app/features/tests/testRef';
import type { UserTestResponse } from '@/app/types';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import TestPageHeader from '../_components/TestPageHeader';
import styles from '../_components/TestPage.module.scss';
import { useTestHistory } from './_hooks/useTestHistory';
import { formatDuration, formatScore } from '../_lib/formatAttempt';
import { formatDateTime } from '@/app/utils/format-date-time';

const cx = classNamesBind.bind(styles);
const ui = classNamesBind.bind(uiStyles);


type StatusLabelKey = 'completed' | 'inProgress' | 'expired';

const STATUS: Record<string, { labelKey: StatusLabelKey; tone: string | null }> = {
  [UserTestStatus.COMPLETED]: { labelKey: 'completed', tone: 'pillSuccess' },
  [UserTestStatus.IN_PROGRESS]: { labelKey: 'inProgress', tone: 'pillBrand' },
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
  const t = useTranslations('TestTaking.history');
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
          <FileText size="1em" className={ui('emptyIcon')} aria-hidden="true" />
          <h2>{t('empty.title')}</h2>
          <p>{t('empty.desc')}</p>
        </div>
      );
    }

    return (
      <>
        <section className={cx('stats')} aria-label={t('stats.label')}>
          <div className={cx('stat')}>
            <span className={ui('eyebrow')}>{t('stats.attempts')}</span>
            <span className={cx('statValue')}>{attempts.length}</span>
            <span className={cx('statMeta')}>{t('stats.completed', { count: summary.completedCount })}</span>
          </div>
          <div className={cx('stat')}>
            <span className={ui('eyebrow')}>{t('stats.best')}</span>
            <span className={cx('statValue')}>{formatScore(summary.best)}</span>
          </div>
          <div className={cx('stat')}>
            <span className={ui('eyebrow')}>{t('stats.latest')}</span>
            <span className={cx('statValue')}>{formatScore(summary.latest)}</span>
            {summary.delta != null && (
              <span className={cx('statMeta', summary.delta > 0 ? 'up' : summary.delta < 0 ? 'down' : null)}>
                {summary.delta > 0 ? '+' : ''}
                {t('stats.delta', { delta: formatScore(summary.delta) })}
              </span>
            )}
          </div>
          <div className={cx('stat')}>
            <span className={ui('eyebrow')}>{t('stats.avgDuration')}</span>
            <span className={cx('statValue')}>{formatDuration(summary.avgDuration)}</span>
          </div>
        </section>

        <section aria-labelledby="attempts-title">
          <div className={cx('sectionHead')}>
            <h2 id="attempts-title" className={cx('sectionTitle')}>
              {t('attemptsTitle')}
            </h2>
            <span className={cx('sectionCount')}>{attempts.length}</span>
          </div>

          <div className={cx('tableWrap')}>
            <table className={cx('table')}>
              <thead>
                <tr>
                  <th>{t('columns.attempt')}</th>
                  <th>{t('columns.started')}</th>
                  <th>{t('columns.submitted')}</th>
                  <th>{t('columns.duration')}</th>
                  <th className={cx('right')}>{t('columns.score')}</th>
                  <th>{t('columns.status')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a, i) => {
                  const status = STATUS[a.status as string] ?? { labelKey: 'expired', tone: 'pillWarning' };
                  const isBest =
                    a.status === UserTestStatus.COMPLETED &&
                    summary.completedCount > 1 &&
                    a.totalScore === summary.best;
                  return (
                    <tr key={a.userTestId}>
                      <td>
                        <span className={cx('attemptCell')}>
                          <span className={cx('rank')}>#{attempts.length - i}</span>
                          {isPracticeAttempt(a) && <span className={ui('pill')}>{t('practice')}</span>}
                        </span>
                      </td>
                      <td className={cx('mono', 'dim')}>{formatDateTime(a.startedAt, '—')}</td>
                      <td className={cx('mono', 'dim')}>{formatDateTime(a.finishedAt, '—')}</td>
                      <td className={cx('mono', 'dim')}>{formatDuration(a.durationTaken)}</td>
                      <td className={cx('right')}>
                        <span className={cx('attemptCell', 'attemptCellEnd')}>
                          {isBest && <span className={ui('pill', 'pillSuccess')}>{t('bestPill')}</span>}
                          <span className={cx('score')}>{formatScore(a.totalScore)}</span>
                        </span>
                      </td>
                      <td>
                        <span className={ui('pill', status.tone)}>{t(`status.${status.labelKey}`)}</span>
                      </td>
                      <td className={cx('right')}>
                        {a.status === UserTestStatus.COMPLETED ? (
                          <Link href={`/tests/result/${a.userTestId}`} className={ui('btnSecondary', 'btnSm')}>
                            {t('viewResult')}
                            <ArrowRight size="1em" aria-hidden="true" />
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
