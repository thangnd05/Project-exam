import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import RecoveryResourceLink from '~/shared/resources/RecoveryResourceLink';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';
import { sortByPartOrder } from '~/shared/utils/partOrder';
import { priorityTierLabel } from '~/shared/utils/priorityTier';

const cx = classNames.bind(styles);

const TASK_STATUS = {
  PASSED: { text: 'Đã đạt', variant: 'badgeSuccess' },
  ACTIVE: { text: 'Chưa đạt', variant: 'badgePrimary' },
  LOCKED: { text: 'Chưa mở', variant: 'badgeMuted' },
  SKIPPED: { text: 'Bỏ qua', variant: 'badgeMuted' },
};

const CAPSTONE_TYPES = new Set(['PART_CAPSTONE_1', 'PART_CAPSTONE_2']);

const PRIORITY_VARIANT = {
  HIGH: 'badgeDanger',
  MEDIUM: 'badgeWarning',
  LOW: 'badgeMuted',
};

function PlanPartTaskList({
  partGroups = [],
  learningPlanId,
  studyAction = 'link',
  onStudyTask,
  compact = false,
}) {
  if (!partGroups.length) {
    return <p className={cx('muted')}>Chưa có ải trong kế hoạch.</p>;
  }

  const orderedGroups = sortByPartOrder(partGroups, { nameKey: 'examPartName' });

  return (
    <div>
      {orderedGroups.map((group) => (
        <div key={group.examPartId} className={cx('partGroup')}>
          <div className={cx('partGroupHeader')}>
            <div>
              <div className={cx('partGroupTag')}>Part</div>
              <h4 className={cx('partGroupName')}>{group.examPartName}</h4>
            </div>
            <span className={cx('badge', 'badgePrimary')}>
              {group.passedTasksInPart}/{group.totalTasksInPart} ải
              {group.passAccuracy != null ? ` · cần ≥${group.passAccuracy}%` : ''}
            </span>
          </div>
          <div className={cx('partGroupBody')}>
            <p className={cx('partGroupHint')}>
              Bước 1: đọc tài liệu · Bước 2: bấm Học ải để luyện (thứ tự ải tùy ý).
            </p>
            {(group.partResources || []).length > 0 && (
              <div className={cx('resourceBox')}>
                <div className={cx('resourceLabel')}>
                  Giới thiệu &amp; cách làm Part (đọc trước)
                </div>
                {group.partResources.map((r) => (
                  <div key={r.resourceId}>
                    <RecoveryResourceLink resource={r} className={cx('resourceLink')}>
                      {r.title || r.originalFileName || 'Mở tài liệu'}
                    </RecoveryResourceLink>
                    {r.description && (
                      <p className={cx('resourceDesc')}>{r.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {(group.tasks || []).map((t) => (
              <PartTaskRow
                key={t.taskId}
                task={t}
                learningPlanId={learningPlanId}
                studyAction={studyAction}
                onStudyTask={onStudyTask}
                compact={compact}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PartTaskRow({ task, learningPlanId, studyAction, onStudyTask, compact }) {
  const status = TASK_STATUS[task.status] || TASK_STATUS.ACTIVE;
  const isCapstone = CAPSTONE_TYPES.has(task.taskType);
  const canStudy = task.status !== 'SKIPPED' && task.status !== 'LOCKED';
  const resource = task.studyResource;
  const priorityVariant =
    PRIORITY_VARIANT[task.priorityTier] || PRIORITY_VARIANT.MEDIUM;
  const questionLabel = task.targetQuestionCount != null
    ? `${task.targetQuestionCount} câu (hết kho thì lấy tối đa có)`
    : null;

  const studyButton =
    studyAction === 'button' ? (
      <button
        type="button"
        className={cx('btn', 'btnPrimary', 'btnSm')}
        disabled={!canStudy}
        onClick={() => onStudyTask?.(task.taskId)}
      >
        Học ải
      </button>
    ) : (
      <Link
        to={`/learning-plans/${learningPlanId}/study?taskId=${task.taskId}`}
        className={cx('btn', 'btnPrimary', 'btnSm')}
        aria-disabled={!canStudy}
        onClick={(e) => {
          if (!canStudy) e.preventDefault();
        }}
      >
        Học ải
      </Link>
    );

  return (
    <div className={cx('taskRow', { compact })}>
      <div className={cx('taskRowHead')}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={cx('taskTitle')}>
            <span>
              <span className={cx('taskTitleHint')}>Ải #{task.taskOrder}</span>
              {task.tagName}
            </span>
            {task.priorityTier && (
              <span className={cx('badge', priorityVariant)}>
                {priorityTierLabel(task.priorityTier)}
              </span>
            )}
          </div>
          <div className={cx('taskStats')}>
            {task.wrongCountAtDiagnosis != null && (
              <span>Sai {task.wrongCountAtDiagnosis} câu (mock)</span>
            )}
            {task.baselineAccuracy != null && (
              <span>Gốc {task.baselineAccuracy}%</span>
            )}
            {task.bestAccuracy != null && (
              <span>Tốt nhất {task.bestAccuracy}%</span>
            )}
            {task.passAccuracy != null && (
              <span>Pass ≥{task.passAccuracy}%</span>
            )}
            {questionLabel && (
              <span>{questionLabel}</span>
            )}
          </div>
          {task.status === 'LOCKED' && (
            <p className={cx('muted', 'small')}>
              {isCapstone
                ? 'Hoàn thành các ải tag (và lần 1 nếu là lần 2) trước khi mở.'
                : 'Ải sẽ mở khi đủ điều kiện.'}
            </p>
          )}
        </div>
        <span className={cx('badge', status.variant)}>{status.text}</span>
      </div>

      {!compact && !isCapstone && (
        <div className={cx('resourceBox')}>
          <div className={cx('resourceLabel')}>Tài liệu (đọc trước)</div>
          {resource?.url || resource?.resourceId ? (
            <>
              <RecoveryResourceLink
                resource={resource}
                className={cx('resourceLink')}
              >
                {resource.title || resource.originalFileName || 'Mở tài liệu'}
              </RecoveryResourceLink>
              {resource.description && (
                <p className={cx('resourceDesc')}>{resource.description}</p>
              )}
            </>
          ) : (
            <span className={cx('muted', 'small')}>
              Chưa gắn tài liệu cho tag này (admin: Recovery Resource + tag).
            </span>
          )}
        </div>
      )}

      <div className={cx('taskActions')}>
        {!compact && (resource?.url || resource?.resourceId) && (
          <RecoveryResourceLink
            resource={resource}
            className={cx('btn', 'btnOutline', 'btnSm')}
          >
            Xem tài liệu
          </RecoveryResourceLink>
        )}
        {!compact && task.status === 'PASSED' && (
          <Link
            to={`/learning-plans/${learningPlanId}/study?taskId=${task.taskId}&review=true`}
            className={cx('btn', 'btnOutline', 'btnSm')}
          >
            Xem giải thích
          </Link>
        )}
        {studyButton}
      </div>
    </div>
  );
}

export default PlanPartTaskList;

export function groupTasksByPart(tasks) {
  const map = new Map();
  (tasks || []).forEach((t) => {
    const key = t.examPartId || 'unknown';
    if (!map.has(key)) {
      map.set(key, {
        examPartId: key,
        examPartName: t.examPartName || key,
        passAccuracy: t.passAccuracy,
        passedTasksInPart: 0,
        totalTasksInPart: 0,
        tasks: [],
      });
    }
    const g = map.get(key);
    g.tasks.push(t);
    g.tasks.sort((a, b) => (a.taskOrder ?? 0) - (b.taskOrder ?? 0));
    g.totalTasksInPart += 1;
    if (t.status === 'PASSED') g.passedTasksInPart += 1;
  });
  return sortByPartOrder(Array.from(map.values()), { nameKey: 'examPartName' });
}
