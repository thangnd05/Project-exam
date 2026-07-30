import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import RecoveryResourceLink from '~/shared/resources/RecoveryResourceLink';
import { formatDateTime24 as formatDateTime } from '~/shared/utils/format-date-time';
import { useTaskHistory } from './hooks/useTaskHistory';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

const TASK_STATUS_LABEL = {
  ACTIVE: 'Đang học',
  PASSED: 'Đã vượt',
  SKIPPED: 'Bỏ qua',
  LOCKED: 'Khoá',
};

function pct(v) {
  if (v == null) return '—';
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(n)) return '—';
  return `${n.toFixed(2)}%`;
}

function TaskHistoryPage() {
  const { learningPlanId, taskId } = useParams();
  const { plan, sessions, isLoading: loading, sessionsError, error } = useTaskHistory(
    learningPlanId,
    taskId,
  );

  const task = useMemo(() => {
    if (!plan) return null;
    return (plan.partGroups || [])
      .flatMap((g) => g.tasks || [])
      .find((t) => t.taskId === taskId) || null;
  }, [plan, taskId]);

  if (loading) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('loading')}>Đang tải...</div>
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
          <span>Không tìm thấy ải này trong plan.</span>
          <Link to={`/learning-plans/${learningPlanId}`} className={cx('btn', 'btnOutline', 'btnSm')}>
            Về plan
          </Link>
        </div>
      </div>
    );
  }

  const baseline = task.baselineAccuracy != null ? Number(task.baselineAccuracy) : null;
  const best = task.bestAccuracy != null ? Number(task.bestAccuracy) : null;
  const pass = task.passAccuracy ?? 70;
  const delta = baseline != null && best != null ? best - baseline : null;

  return (
    <div className={cx('wrapper')}>
      <div className={cx('headerBar')}>
        <Link
          to={`/learning-plans/${learningPlanId}`}
          className={cx('btn', 'btnGhost', 'btnSm')}
        >
          ← Lộ trình #{plan.planSequence ?? '?'}
        </Link>
        <Link
          to={`/learning-plans/${learningPlanId}/study?taskId=${task.taskId}`}
          className={cx('btn', 'btnPrimary', 'btnSm')}
        >
          Học tiếp ải này
        </Link>
      </div>

      <h2 className={cx('title')}>
        {task.examPartName || 'Part'} · Ải {task.tagName || '—'}
      </h2>
      <div className={cx('actionBar')} style={{ marginBottom: '2rem' }}>
        <span className={cx('badge', 'badgeMuted')}>
          Trạng thái: {TASK_STATUS_LABEL[task.status] || task.status}
        </span>
        <span className={cx('badge', 'badgeMuted')}>
          Cần ≥ {pass}% để vượt ải
        </span>
      </div>

      <div className={cx('statGrid')}>
        <div className={cx('statTile')}>
          <div className={cx('statLabel')}>Lúc chẩn đoán</div>
          <div className={cx('statValue')}>{pct(baseline)}</div>
          <div className={cx('statHint')}>
            Sai {task.wrongCountAtDiagnosis ?? '—'} câu
          </div>
        </div>

        <div className={cx('statTile')}>
          <div className={cx('statLabel')}>Tốt nhất khi luyện</div>
          <div className={cx('statValue')}>{pct(best)}</div>
          {delta != null && (
            <div
              className={cx('statHint', {
                successText: delta > 0,
                dangerText: delta < 0,
                muted: delta === 0,
              })}
            >
              {delta > 0 ? '+' : ''}{delta.toFixed(1)}% vs chẩn đoán
            </div>
          )}
        </div>

        <div className={cx('statTile')}>
          <div className={cx('statLabel')}>Số lần luyện</div>
          <div className={cx('statValue')}>{task.attemptCount ?? 0}</div>
          <div className={cx('statHint')}>lượt luyện</div>
        </div>

        <div className={cx('statTile')}>
          <div className={cx('statLabel')}>Ngưỡng vượt ải</div>
          <div className={cx('statValue')}>{pass}%</div>
          {best != null && (
            <div className={cx('statHint', best >= pass ? 'successText' : 'warningText')}>
              {best >= pass ? 'Đã đạt ngưỡng' : `Còn ${(pass - best).toFixed(1)}%`}
            </div>
          )}
        </div>
      </div>

      {baseline != null && best != null && (
        <div className={cx('card')}>
          <div className={cx('cardHeader')}>Tiến triển (chẩn đoán → tốt nhất)</div>
          <div className={cx('cardBody')}>
            <div className={cx('progressBar')}>
              <div
                className={cx('progressBaseline')}
                style={{ width: `${Math.min(100, baseline)}%` }}
                title={`Ban đầu ${pct(baseline)}`}
              />
              <div
                className={cx('progressBest', { reached: best >= pass })}
                style={{ width: `${Math.min(100, best)}%` }}
                title={`Tốt nhất ${pct(best)}`}
              />
              <div
                className={cx('progressPassLine')}
                style={{ left: `${pass}%` }}
                title={`Ngưỡng vượt ải ${pass}%`}
              />
            </div>
            <div className={cx('progressLegend')}>
              <span>0%</span>
              <span className={cx('dangerText')}>Pass {pass}%</span>
              <span>100%</span>
            </div>
            <div style={{ marginTop: '0.8rem', fontSize: 'var(--font-size-sm)' }}>
              <span className={cx('badge', 'badgeWarning')}>Ban đầu</span>{' '}
              {pct(baseline)}{' '}·{' '}
              <span className={cx('badge', best >= pass ? 'badgeSuccess' : 'badgePrimary')}>Tốt nhất</span>{' '}
              {pct(best)}
            </div>
          </div>
        </div>
      )}

      {task.studyResource && (
        <div className={cx('card')}>
          <div className={cx('cardHeader')}>Tài liệu được gắn cho ải</div>
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
        <div className={cx('cardHeader')}>Lịch sử các lần luyện</div>
        {sessionsError && (
          <div className={cx('cardBody')}>
            <div className={cx('alert', 'alertDanger')} style={{ marginBottom: 0 }}>
              {sessionsError}
            </div>
          </div>
        )}
        {!sessionsError && sessions.length === 0 && (
          <div className={cx('cardBody', 'muted')}>
            Chưa có lần luyện nào cho ải này.
          </div>
        )}
        {!sessionsError && sessions.length > 0 && (
          <table className={cx('table')}>
            <thead>
              <tr>
                <th>#</th>
                <th>Bắt đầu</th>
                <th>Nộp</th>
                <th className={cx('right')}>Số câu</th>
                <th className={cx('right')}>Độ chính xác</th>
                <th>Kết quả</th>
                <th className={cx('right')}>Bài làm</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, idx) => (
                <tr key={s.sessionId}>
                  <td>{sessions.length - idx}</td>
                  <td className={cx('small')}>{formatDateTime(s.startedAt)}</td>
                  <td className={cx('small')}>{formatDateTime(s.submittedAt)}</td>
                  <td className={cx('right')}>{s.questionCount ?? '—'}</td>
                  <td className={cx('right')}>
                    {s.accuracy != null ? `${s.accuracy}%` : '—'}
                  </td>
                  <td>
                    {s.status === 'IN_PROGRESS' ? (
                      <span className={cx('badge', 'badgeWarning')}>Đang làm</span>
                    ) : s.passed === true ? (
                      <span className={cx('badge', 'badgeSuccess')}>Đạt</span>
                    ) : s.passed === false ? (
                      <span className={cx('badge', 'badgeMuted')}>Chưa đạt</span>
                    ) : (
                      <span className={cx('muted', 'small')}>—</span>
                    )}
                  </td>
                  <td className={cx('right')}>
                    {s.status === 'SUBMITTED' ? (
                      <Link
                        to={`/learning-plans/${learningPlanId}/sessions/${s.sessionId}/review?taskId=${taskId}`}
                        className={cx('btn', 'btnOutline', 'btnSm')}
                      >
                        Xem đáp án
                      </Link>
                    ) : (
                      <span className={cx('muted', 'small')}>—</span>
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

export default TaskHistoryPage;
