'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import classNames from 'classnames/bind';
import RecoveryResourceLink from '@/app/features/resources/RecoveryResourceLink/RecoveryResourceLink';
import { formatDateTime } from '@/app/utils/format-date-time';
import { useTaskHistory } from './_hooks/useTaskHistory';
import { taskDisplayName, taskStatusLabel } from '@/app/features/learning-plans/planLabels';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import { SessionStatus } from '@/app/enums';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import ButtonPrime from '@/app/components/Button/ButtonPrime';

const cx = classNames.bind(styles);

function pct(v?: number | string | null) {
  if (v == null) return '-';
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(n)) return '-';
  return `${n.toFixed(2)}%`;
}

function TaskHistory() {
  const t = useTranslations('LearningPlans');
  const tc = useTranslations('Common');
  const { taskId } = useParams<{ taskId: string }>();
  const { plan, sessions, isLoading: loading, sessionsError, error } = useTaskHistory(taskId);
  const learningPlanId = plan?.learningPlanId;

  const task = useMemo(() => {
    if (!plan) return null;
    return (plan.partGroups || [])
      .flatMap((g) => g.tasks || [])
      .find((t) => t.taskId === taskId) || null;
  }, [plan, taskId]);

  if (loading) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('loading')}>{tc('loading')}</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('alert', 'alertDanger')}>{error}</div>
      </div>
    );
  }
  if (!plan || !task) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('alert', 'alertWarning')}>
          <span>{t('history.notFound')}</span>
          <ButtonPrime
            as="link"
            variant="outline"
            size="sm"
            href={learningPlanId ? `/dashboard/learning-paths/${learningPlanId}` : '/learning-paths'}
          >
            {t('history.backToPlan')}
          </ButtonPrime>
        </div>
      </div>
    );
  }

  const baseline = task.baselineAccuracy != null ? Number(task.baselineAccuracy) : null;
  const best = task.bestAccuracy != null ? Number(task.bestAccuracy) : null;
  const pass = task.passAccuracy;
  const delta = baseline != null && best != null ? best - baseline : null;

  return (
    <div className={cx('wrapper')}>
      <div className={cx('headerBar')}>
        <ButtonPrime
          as="link"
          variant="ghost"
          size="sm"
          href={`/dashboard/learning-paths/${learningPlanId}`}
        >
          <ArrowLeft size={16} /> {t('common.planName', { sequence: plan.planSequence ?? '?' })}
        </ButtonPrime>
      </div>

      <PageHeader
        title={t('common.taskTitle', {
          part: task.examPartName || t('common.partFallback'),
          task: taskDisplayName(t, task),
        })}
        meta={
          <div className={cx('actionBar', 'mt-2')}>
            <span className={cx('badge', 'badgeMuted')}>
              {t('history.status', { status: taskStatusLabel(t, task.status) })}
            </span>
            <span className={cx('badge', 'badgeMuted')}>
              {t('history.passNeeded', { pass: pass != null ? `${pass}%` : '-' })}
            </span>
          </div>
        }
      >
        <ButtonPrime
          as="link"
          variant="primary"
          size="sm"
          href={`/dashboard/learning-paths/${learningPlanId}/study?taskId=${task.taskId}`}
        >
          {t('history.continueTask')}
        </ButtonPrime>
      </PageHeader>

      <div className={cx('statGrid')}>
        <div className={cx('statTile')}>
          <div className={cx('statLabel')}>{t('history.baseline')}</div>
          <div className={cx('statValue')}>{pct(baseline)}</div>
          <div className={cx('statHint')}>
            {t('history.wrongCount', { count: task.wrongCountAtDiagnosis ?? '-' })}
          </div>
        </div>

        <div className={cx('statTile')}>
          <div className={cx('statLabel')}>{t('history.best')}</div>
          <div className={cx('statValue')}>{pct(best)}</div>
          {delta != null && (
            <div
              className={cx('statHint', {
                successText: delta > 0,
                dangerText: delta < 0,
                muted: delta === 0,
              })}
            >
              {t('history.deltaVsBaseline', { delta: `${delta > 0 ? '+' : ''}${delta.toFixed(1)}` })}
            </div>
          )}
        </div>

        <div className={cx('statTile')}>
          <div className={cx('statLabel')}>{t('history.attempts')}</div>
          <div className={cx('statValue')}>{task.attemptCount ?? 0}</div>
          <div className={cx('statHint')}>{t('history.attemptsUnit')}</div>
        </div>

        <div className={cx('statTile')}>
          <div className={cx('statLabel')}>{t('history.threshold')}</div>
          <div className={cx('statValue')}>{pass != null ? `${pass}%` : '-'}</div>
          {best != null && pass != null && (
            <div className={cx('statHint', best >= pass ? 'successText' : 'warningText')}>
              {best >= pass ? t('history.reached') : t('history.remaining', { gap: (pass - best).toFixed(1) })}
            </div>
          )}
        </div>
      </div>

      {baseline != null && best != null && (
        <div className={cx('card')}>
          <div className={cx('cardHeader')}>{t('history.progressCard')}</div>
          <div className={cx('cardBody')}>
            <div className={cx('progressBar')}>
              <div
                className={cx('progressBaseline')}
                style={{ width: `${Math.min(100, baseline)}%` }}
                title={t('history.baselineTitle', { value: pct(baseline) })}
              />
              <div
                className={cx('progressBest', { reached: pass != null && best >= pass })}
                style={{ width: `${Math.min(100, best)}%` }}
                title={t('history.bestTitle', { value: pct(best) })}
              />
              {pass != null && (
                <div
                  className={cx('progressPassLine')}
                  style={{ left: `${pass}%` }}
                  title={t('history.thresholdTitle', { pass })}
                />
              )}
            </div>
            <div className={cx('progressLegend')}>
              <span>0%</span>
              <span className={cx('dangerText')}>
                {t('history.passLegend', { pass: pass != null ? `${pass}%` : '-' })}
              </span>
              <span>100%</span>
            </div>
            <div style={{ marginTop: '0.8rem', fontSize: 'var(--font-size-sm)' }}>
              <span className={cx('badge', 'badgeWarning')}>{t('history.baselineBadge')}</span>{' '}
              {pct(baseline)}{' '}·{' '}
              <span className={cx('badge', pass != null && best >= pass ? 'badgeSuccess' : 'badgePrimary')}>{t('history.bestBadge')}</span>{' '}
              {pct(best)}
            </div>
          </div>
        </div>
      )}

      {task.studyResource && (
        <div className={cx('card')}>
          <div className={cx('cardHeader')}>{t('history.resourceCard')}</div>
          <div className={cx('cardBody')}>
            <RecoveryResourceLink resource={task.studyResource}>
              {task.studyResource.title}
            </RecoveryResourceLink>
            {task.studyResource.description && (
              <p className={cx('muted')} style={{ marginTop: '0.4rem', marginBottom: 0, fontSize: 'var(--font-size-sm)' }}>
                {task.studyResource.description}
              </p>
            )}
          </div>
        </div>
      )}

      <div className={cx('card')}>
        <div className={cx('cardHeader')}>{t('history.sessionsCard')}</div>
        {sessionsError && (
          <div className={cx('cardBody')}>
            <div className={cx('alert', 'alertDanger')} style={{ marginBottom: 0 }}>
              {sessionsError}
            </div>
          </div>
        )}
        {!sessionsError && sessions.length === 0 && (
          <div className={cx('cardBody', 'muted')}>
            {t('history.noSessions')}
          </div>
        )}
        {!sessionsError && sessions.length > 0 && (
          <table className={cx('table')}>
            <thead>
              <tr>
                <th>#</th>
                <th>{t('history.table.started')}</th>
                <th>{t('history.table.submitted')}</th>
                <th className={cx('right')}>{t('history.table.questions')}</th>
                <th className={cx('right')}>{t('history.table.accuracy')}</th>
                <th>{t('history.table.result')}</th>
                <th className={cx('right')}>{t('history.table.review')}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, idx) => (
                <tr key={s.sessionId}>
                  <td>{sessions.length - idx}</td>
                  <td className={cx('small')}>{formatDateTime(s.startedAt)}</td>
                  <td className={cx('small')}>{formatDateTime(s.submittedAt)}</td>
                  <td className={cx('right')}>{s.questionCount ?? '-'}</td>
                  <td className={cx('right')}>
                    {s.accuracy != null ? `${s.accuracy}%` : '-'}
                  </td>
                  <td>
                    {s.status === SessionStatus.IN_PROGRESS ? (
                      <span className={cx('badge', 'badgeWarning')}>{t('history.inProgress')}</span>
                    ) : s.passed === true ? (
                      <span className={cx('badge', 'badgeSuccess')}>{t('history.passed')}</span>
                    ) : s.passed === false ? (
                      <span className={cx('badge', 'badgeMuted')}>{t('history.failed')}</span>
                    ) : (
                      <span className={cx('muted', 'small')}>-</span>
                    )}
                  </td>
                  <td className={cx('right')}>
                    {s.status === SessionStatus.SUBMITTED ? (
                      <ButtonPrime
                        as="link"
                        variant="outline"
                        size="sm"
                        href={`/dashboard/learning-paths/${learningPlanId}/sessions/${s.sessionId}/review?taskId=${taskId}`}
                      >
                        {t('history.viewAnswers')}
                      </ButtonPrime>
                    ) : (
                      <span className={cx('muted', 'small')}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default TaskHistory;
