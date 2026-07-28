import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import {
  BookOpen,
  Check,
  ChevronDown,
  Flag,
  Flame,
  History,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import RecoveryResourceLink from '~/shared/resources/RecoveryResourceLink';
import InfoTip from '~/shared/ui/InfoTip/InfoTip';
import { TERM_TIPS } from '~/features/diagnostic/termTips';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';
import { sortByPartOrder } from '~/shared/utils/partOrder';
import { isTaskStuck, taskCurrentAccuracy, taskGapToPass } from '~/shared/utils/taskProgress';

const cx = classNames.bind(styles);

const TASK_STATUS = {
  PASSED: { text: 'Đã vượt', variant: 'badgeSuccess' },
  ACTIVE: { text: 'Chưa vượt', variant: 'badgePrimary' },
  LOCKED: { text: 'Chưa mở', variant: 'badgeMuted' },
  SKIPPED: { text: 'Bỏ qua', variant: 'badgeMuted' },
};

const CAPSTONE_TYPES = new Set(['PART_CAPSTONE_1', 'PART_CAPSTONE_2']);

/** Gap còn lại đủ nhỏ thì gắn nhãn "Sắp vượt" để tạo động lực đánh nốt. */
const NEAR_PASS_GAP = 10;

// Toạ độ bản đồ: x theo % bề ngang (đường đi lượn sóng), y theo px.
const NODE_X = [50, 74, 50, 26];
const ROW_STEP = 140;
const MAP_TOP = 72;
const MAP_BOTTOM = 124;

function nodeX(i) {
  return NODE_X[i % NODE_X.length];
}

function nodeY(i) {
  return MAP_TOP + i * ROW_STEP;
}

/** Đường cong nối ải `from` → ải `to` — cubic với control point dọc để thành hình rắn lượn. */
function buildPathD(from, to) {
  if (to <= from) return '';
  let d = `M ${nodeX(from)} ${nodeY(from)}`;
  for (let i = from + 1; i <= to; i += 1) {
    const mid = ROW_STEP / 2;
    d += ` C ${nodeX(i - 1)} ${nodeY(i - 1) + mid}, ${nodeX(i)} ${nodeY(i) - mid}, ${nodeX(i)} ${nodeY(i)}`;
  }
  return d;
}

/** Index ải cuối cùng đã vượt — đoạn đường tô xanh chạy tới đây. */
function lastPassedIndex(tasks) {
  let last = -1;
  tasks.forEach((t, i) => {
    if (t.status === 'PASSED') last = i;
  });
  return last;
}

/** Mở sẵn chặng đang học (chứa ải gợi ý), nếu không có thì chặng chưa xong đầu tiên. */
function defaultOpenParts(groups, recommendedTaskId) {
  if (!groups.length) return new Set();
  if (recommendedTaskId) {
    const hit = groups.find((g) => (g.tasks || []).some((t) => t.taskId === recommendedTaskId));
    if (hit) return new Set([hit.examPartId]);
  }
  const firstUnfinished = groups.find((g) => g.passedTasksInPart < g.totalTasksInPart);
  return new Set([(firstUnfinished || groups[0]).examPartId]);
}

function ProgressRing({ value, done }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <span className={cx('ring', { ringDone: done })} aria-hidden>
      <svg viewBox="0 0 40 40" className={cx('ringSvg')}>
        <circle className={cx('ringTrack')} cx="20" cy="20" r={r} />
        <circle
          className={cx('ringBar')}
          cx="20"
          cy="20"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, Math.max(0, value)) / 100)}
        />
      </svg>
      <span className={cx('ringLabel')}>{done ? <Trophy size={14} /> : `${value}%`}</span>
    </span>
  );
}

function PlanPartTaskList({
  partGroups = [],
  learningPlanId,
  recommendedTaskId,
  studyAction = 'link',
  onStudyTask,
}) {
  const orderedGroups = useMemo(
    () => sortByPartOrder(partGroups, { nameKey: 'examPartName' }),
    [partGroups],
  );
  const fallbackOpen = useMemo(
    () => defaultOpenParts(orderedGroups, recommendedTaskId),
    [orderedGroups, recommendedTaskId],
  );
  // null = chưa can thiệp → dùng mặc định (chặng đang học); có Set = user tự chọn.
  const [openOverride, setOpenOverride] = useState(null);
  const openIds = openOverride ?? fallbackOpen;

  if (!orderedGroups.length) {
    return <p className={cx('muted')}>Chưa có ải trong kế hoạch.</p>;
  }

  const allOpen = orderedGroups.every((g) => openIds.has(g.examPartId));

  const togglePart = (partId) => {
    const next = new Set(openIds);
    if (next.has(partId)) next.delete(partId);
    else next.add(partId);
    setOpenOverride(next);
  };

  const toggleAll = () => {
    setOpenOverride(allOpen ? new Set() : new Set(orderedGroups.map((g) => g.examPartId)));
  };

  return (
    <div>
      <div className={cx('roadmapBar')}>
        <p className={cx('roadmapLegend')}>
          <span className={cx('legendItem')}>
            <span className={cx('legendDot', 'legendPassed')}>
              <Check size={11} />
            </span>
            Đã vượt
          </span>
          <span className={cx('legendItem')}>
            <span className={cx('legendDot', 'legendCurrent')} />
            Đang mở
          </span>
          <span className={cx('legendItem')}>
            <span className={cx('legendDot', 'legendLocked')}>
              <Lock size={10} />
            </span>
            Chưa mở
          </span>
        </p>
        <button type="button" className={cx('linkBtn')} onClick={toggleAll}>
          {allOpen ? 'Thu gọn tất cả' : 'Mở tất cả chặng'}
        </button>
      </div>

      {orderedGroups.map((group, index) => {
        const total = group.totalTasksInPart || (group.tasks || []).length || 0;
        const passed = group.passedTasksInPart || 0;
        const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
        const done = total > 0 && passed >= total;
        const open = openIds.has(group.examPartId);

        return (
          <section key={group.examPartId} className={cx('partGroup', { partGroupDone: done })}>
            <button
              type="button"
              className={cx('partHeader', { partHeaderDone: done })}
              onClick={() => togglePart(group.examPartId)}
              aria-expanded={open}
            >
              <span className={cx('partCrest', { partCrestDone: done })}>
                <span className={cx('partCrestLabel')}>Chặng</span>
                <span className={cx('partCrestNo')}>{index + 1}</span>
              </span>
              <span className={cx('partHeaderMain')}>
                <span className={cx('partGroupName')}>{group.examPartName}</span>
                <span className={cx('partHeaderMeta')}>
                  <strong>
                    {passed}/{total}
                  </strong>{' '}
                  ải đã vượt
                  {group.passAccuracy != null && ` · ngưỡng đạt ≥${group.passAccuracy}%`}
                </span>
              </span>
              {done && (
                <span className={cx('partDoneBadge')}>
                  <Trophy size={13} /> Hoàn thành
                </span>
              )}
              <ProgressRing value={pct} done={done} />
              <ChevronDown className={cx('partChevron', { partChevronOpen: open })} size={20} />
            </button>

            {open && (
              <StageMap
                group={group}
                learningPlanId={learningPlanId}
                recommendedTaskId={recommendedTaskId}
                studyAction={studyAction}
                onStudyTask={onStudyTask}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}

/** Bản đồ màn chơi của một chặng: đường đi + medallion từng ải + bảng chi tiết ải đang chọn. */
function StageMap({ group, learningPlanId, recommendedTaskId, studyAction, onStudyTask }) {
  const tasks = group.tasks || [];
  const defaultSelected = useMemo(() => {
    if (!tasks.length) return null;
    const rec = tasks.find((t) => t.taskId === recommendedTaskId);
    if (rec) return rec.taskId;
    const next = tasks.find((t) => t.status !== 'PASSED' && t.status !== 'LOCKED');
    return (next || tasks[0]).taskId;
  }, [tasks, recommendedTaskId]);

  const [pickedId, setPickedId] = useState(null);
  const selectedId = pickedId ?? defaultSelected;
  const selected = tasks.find((t) => t.taskId === selectedId) || null;

  if (!tasks.length) {
    return (
      <div className={cx('partBody')}>
        <p className={cx('muted')}>Chặng này chưa có ải nào.</p>
      </div>
    );
  }

  const height = nodeY(tasks.length - 1) + MAP_BOTTOM;
  const pathD = buildPathD(0, tasks.length - 1);
  const donePathD = buildPathD(0, lastPassedIndex(tasks));

  return (
    <div className={cx('partBody')}>
      <p className={cx('partGroupHint')}>
        Đi lần lượt từ ải đầu tiên xuống cuối chặng. Bấm vào một ải trên bản đồ để xem chi tiết.
        {group.passAccuracy != null && (
          <>
            {' '}Mỗi ải cần đúng ≥{group.passAccuracy}% mới tính là vượt.
            <InfoTip text={TERM_TIPS.passThreshold} />
          </>
        )}
      </p>

      {(group.partResources || []).length > 0 && (
        <div className={cx('resourceBox')}>
          <div className={cx('resourceInfo')}>
            <div className={cx('resourceLabel')}>
              <BookOpen size={14} /> Giới thiệu &amp; cách làm chặng này (đọc trước)
            </div>
            {group.partResources.map((r) => (
              <div key={r.resourceId}>
                <RecoveryResourceLink resource={r} className={cx('resourceLink')}>
                  {r.title || r.originalFileName || 'Mở tài liệu'}
                </RecoveryResourceLink>
                {r.description && <p className={cx('resourceDesc')}>{r.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cx('stageLayout')}>
        <div className={cx('stagePanel')}>
          {selected && (
            <TaskDetailCard
              task={selected}
              learningPlanId={learningPlanId}
              isRecommended={selected.taskId === recommendedTaskId}
              studyAction={studyAction}
              onStudyTask={onStudyTask}
            />
          )}
        </div>

        <div className={cx('stageMap')} style={{ height: `${height}px` }}>
          <span className={cx('stageFlag', 'stageFlagStart')}>Xuất phát</span>

          <svg
            className={cx('stagePath')}
            width="100%"
            height={height}
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            {pathD && (
              <>
                <path className={cx('stagePathTrack')} d={pathD} />
                {donePathD && <path className={cx('stagePathDone')} d={donePathD} />}
                <path className={cx('stagePathDash')} d={pathD} />
              </>
            )}
          </svg>

          {tasks.map((task, i) => (
            <StageNode
              key={task.taskId}
              task={task}
              index={i}
              isSelected={task.taskId === selectedId}
              isRecommended={task.taskId === recommendedTaskId}
              onSelect={() => setPickedId(task.taskId)}
            />
          ))}

          <span
            className={cx('stageFlag', 'stageFlagEnd')}
            style={{ left: `${nodeX(tasks.length - 1)}%`, top: `${nodeY(tasks.length - 1) + 88}px` }}
          >
            <Flag size={12} /> Hết chặng
          </span>
        </div>
      </div>
    </div>
  );
}

function StageNode({ task, index, isSelected, isRecommended, onSelect }) {
  const isCapstone = CAPSTONE_TYPES.has(task.taskType);
  const isPassed = task.status === 'PASSED';
  const isLocked = task.status === 'LOCKED';
  const state = isPassed
    ? 'nodePassed'
    : isLocked
      ? 'nodeLocked'
      : isRecommended
        ? 'nodeCurrent'
        : 'nodeOpen';

  return (
    <button
      type="button"
      className={cx('stageNodeWrap')}
      style={{ left: `${nodeX(index)}%`, top: `${nodeY(index)}px` }}
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`Ải ${task.taskOrder}: ${task.tagName}`}
    >
      {isRecommended && <span className={cx('stagePin')}>Bạn ở đây</span>}
      <span
        className={cx('stageNode', state, {
          stageNodeCapstone: isCapstone,
          stageNodeSelected: isSelected,
        })}
      >
        {isPassed ? (
          <Check size={22} />
        ) : isLocked ? (
          <Lock size={18} />
        ) : isCapstone ? (
          <Trophy size={22} />
        ) : (
          task.taskOrder
        )}
      </span>
      <span className={cx('stageNodeLabel', { stageNodeLabelActive: isSelected })}>
        {isCapstone ? 'Ải trùm' : task.tagName}
      </span>
    </button>
  );
}

function TaskDetailCard({ task, learningPlanId, isRecommended, studyAction, onStudyTask }) {
  const status = TASK_STATUS[task.status] || TASK_STATUS.ACTIVE;
  const isCapstone = CAPSTONE_TYPES.has(task.taskType);
  const isPassed = task.status === 'PASSED';
  const isLocked = task.status === 'LOCKED';
  const canStudy = task.status !== 'SKIPPED' && !isLocked;
  const resource = task.studyResource;
  const current = taskCurrentAccuracy(task);
  const gap = taskGapToPass(task);
  const stuck = isTaskStuck(task);
  const nearPass = !isPassed && gap != null && gap > 0 && gap <= NEAR_PASS_GAP;

  const studyLabel = isPassed ? 'Luyện lại' : isRecommended ? 'Vào ải ngay' : 'Học ải';
  const StudyIcon = isPassed ? RotateCcw : Play;

  const studyButton =
    studyAction === 'button' ? (
      <button
        type="button"
        className={cx('btn', 'btnPrimary', 'btnSm')}
        disabled={!canStudy}
        onClick={() => onStudyTask?.(task.taskId)}
      >
        <StudyIcon size={14} /> {studyLabel}
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
        <StudyIcon size={14} /> {studyLabel}
      </Link>
    );

  return (
    <div className={cx('stagePanelCard', { stagePanelCardCapstone: isCapstone })}>
      <div className={cx('stagePanelHead')}>
        <span className={cx('stagePanelKicker')}>
          {isCapstone ? 'Ải trùm cuối chặng' : `Ải ${task.taskOrder}`}
        </span>
        <span className={cx('badge', status.variant)}>{status.text}</span>
      </div>

      <h5 className={cx('stagePanelTitle')}>{task.tagName}</h5>

      <div className={cx('taskBadges')}>
        {isRecommended && (
          <span className={cx('chip', 'chipPrimary')}>
            <Sparkles size={12} /> Nên làm tiếp
          </span>
        )}
        {nearPass && <span className={cx('chip', 'chipWarning')}>Sắp vượt · còn {gap}%</span>}
        {stuck && (
          <span className={cx('chip', 'chipDanger')}>
            <Flame size={12} /> Đang bí
          </span>
        )}
      </div>

      {task.passAccuracy != null && !isLocked && (
        <div className={cx('meterWrap')}>
          <div className={cx('meter')}>
            <div
              className={cx('meterFill', { meterFillDone: gap === 0 })}
              style={{ width: `${Math.min(100, current ?? 0)}%` }}
            />
            <span className={cx('meterMark')} style={{ left: `${task.passAccuracy}%` }} />
          </div>
          <div className={cx('meterLabel')}>
            {current == null ? (
              <span>Chưa luyện ải này · cần đúng ≥{task.passAccuracy}% để vượt</span>
            ) : gap === 0 ? (
              <span className={cx('successText')}>
                <strong>{current}%</strong> · đã qua ngưỡng {task.passAccuracy}%
              </span>
            ) : (
              <span>
                <strong>{current}%</strong> hiện tại · còn <strong>{gap}%</strong> nữa là chạm
                ngưỡng {task.passAccuracy}%
              </span>
            )}
          </div>
        </div>
      )}

      <div className={cx('taskStats')}>
        {task.wrongCountAtDiagnosis != null && (
          <span className={cx('metaChip')}>Sai {task.wrongCountAtDiagnosis} câu lúc chẩn đoán</span>
        )}
        {task.targetQuestionCount != null && (
          <span className={cx('metaChip')}>{task.targetQuestionCount} câu mỗi lượt</span>
        )}
      </div>

      {isLocked ? (
        <p className={cx('muted', 'small', 'lockHint')}>
          {isCapstone
            ? 'Vượt hết các ải phía trên của chặng này thì ải trùm sẽ mở.'
            : 'Ải sẽ mở khi bạn hoàn thành các ải trước đó.'}
        </p>
      ) : (
        <>
          {!isCapstone && (
            <div className={cx('stagePanelResource')}>
              <div className={cx('resourceLabel')}>
                <BookOpen size={14} /> Tài liệu nên đọc trước
              </div>
              {resource?.url || resource?.resourceId ? (
                <RecoveryResourceLink resource={resource} className={cx('resourceLink')}>
                  {resource.title || resource.originalFileName || 'Mở tài liệu'}
                </RecoveryResourceLink>
              ) : (
                <span className={cx('muted', 'small')}>Chưa có tài liệu cho tag này</span>
              )}
            </div>
          )}
          <div className={cx('taskActions')}>
            {task.attemptCount > 0 && (
              <Link
                to={`/learning-plans/${learningPlanId}/tasks/${task.taskId}/history`}
                className={cx('btn', 'btnOutline', 'btnSm')}
              >
                <History size={14} /> Lịch sử {task.attemptCount} lượt
              </Link>
            )}
            {isPassed && (
              <Link
                to={`/learning-plans/${learningPlanId}/tasks/${task.taskId}/result`}
                className={cx('btn', 'btnOutline', 'btnSm')}
              >
                Xem giải thích
              </Link>
            )}
            {studyButton}
          </div>
        </>
      )}
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
