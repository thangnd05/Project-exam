import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import {
  BookOpen,
  Check,
  ChevronDown,
  Flag,
  History,
  Lock,
  Sparkles,
  Trophy,
} from 'lucide-react';
import RecoveryResourceLink from '~/shared/resources/RecoveryResourceLink';
import InfoTip from '~/shared/ui/InfoTip/InfoTip';
import { TERM_TIPS } from '~/features/diagnostic/termTips';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';
import { taskCurrentAccuracy, taskGapToPass, taskUnpassedAttempts } from '~/shared/utils/taskProgress';
import {
  CAPSTONE_TYPES,
  TASK_STATUS,
  isCapstoneTask,
  taskDisplayName,
} from '../planLabels';

const cx = classNames.bind(styles);

const NEAR_PASS_GAP = 10;

const NODE_X = [50, 62, 50, 38];
const ROW_STEP = 108;
const MAP_TOP = 56;
const MAP_BOTTOM = 88;

function nodeX(i) {
  return NODE_X[i % NODE_X.length];
}

function nodeY(i) {
  return MAP_TOP + i * ROW_STEP;
}

function labelSide(i) {
  return nodeX(i) >= 50 ? 'right' : 'left';
}

function shortMapLabel(name, max = 32) {
  if (!name) return '';
  const primary = name.split(/\s*[–—(]/)[0].trim();
  if (primary.length <= max) return primary;
  const cut = primary.slice(0, max - 1).replace(/\s+\S*$/, '');
  return `${cut || primary.slice(0, max - 1)}…`;
}

function buildPathD(from, to) {
  if (to <= from) return '';
  let d = `M ${nodeX(from)} ${nodeY(from)}`;
  for (let i = from + 1; i <= to; i += 1) {
    const mid = ROW_STEP / 2;
    d += ` C ${nodeX(i - 1)} ${nodeY(i - 1) + mid}, ${nodeX(i)} ${nodeY(i) - mid}, ${nodeX(i)} ${nodeY(i)}`;
  }
  return d;
}

function taskDotState(task) {
  if (task.status === 'PASSED') return 'partDotPassed';
  return 'partDotPending';
}

function lastPassedIndex(tasks) {
  let last = -1;
  tasks.forEach((t, i) => {
    if (t.status === 'PASSED') last = i;
  });
  return last;
}

function defaultOpenParts(groups, recommendedTaskId) {
  if (!groups.length) return new Set();
  if (recommendedTaskId) {
    const hit = groups.find((g) => (g.tasks || []).some((t) => t.taskId === recommendedTaskId));
    if (hit) return new Set([hit.examPartId]);
  }
  const firstUnfinished = groups.find((g) => g.passedTasksInPart < g.totalTasksInPart);
  return new Set([(firstUnfinished || groups[0]).examPartId]);
}

function PlanPartTaskList({
  partGroups = [],
  learningPlanId,
  recommendedTaskId,
  studyAction = 'link',
  onStudyTask,
  roadmapHeading = null,
}) {
  // BE đã sắp partGroups theo ExamPart.displayOrder  FE chỉ render.
  const orderedGroups = partGroups;
  const fallbackOpen = useMemo(
    () => defaultOpenParts(orderedGroups, recommendedTaskId),
    [orderedGroups, recommendedTaskId],
  );

  const [openOverride, setOpenOverride] = useState(null);
  const openIds = openOverride ?? fallbackOpen;

  if (!orderedGroups.length) {
    return <p className={cx('muted')}>Chưa có ải trong kế hoạch.</p>;
  }

  const togglePart = (partId) => {
    const next = new Set(openIds);
    if (next.has(partId)) next.delete(partId);
    else next.add(partId);
    setOpenOverride(next);
  };

  return (
    <div>
      {roadmapHeading ? (
        <div id="chon-ai-hoc" className={cx('roadmapHeading')}>
          <h3 className={cx('roadmapHeadingTitle')}>
            {roadmapHeading.title}
            {roadmapHeading.tip ? <InfoTip text={roadmapHeading.tip} /> : null}
          </h3>
          {roadmapHeading.description ? (
            <p className={cx('roadmapHeadingDesc')}>{roadmapHeading.description}</p>
          ) : null}
        </div>
      ) : null}

      {orderedGroups.map((group, index) => {
        const total = group.totalTasksInPart || (group.tasks || []).length || 0;
        const passed = group.passedTasksInPart || 0;
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
                  ải đã xong
                  {group.passAccuracy != null && ` · ngưỡng đạt ≥${group.passAccuracy}%`}
                </span>
                <span className={cx('partDots')}>
                  {(group.tasks || []).map((t) => (
                    <span
                      key={t.taskId}
                      className={cx('partDot', taskDotState(t), {
                        partDotCapstone: CAPSTONE_TYPES.has(t.taskType),
                      })}
                    />
                  ))}
                </span>
              </span>
              {done && (
                <span className={cx('partDoneBadge')}>
                  <Trophy size={13} /> Hoàn thành
                </span>
              )}
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

function StageMap({ group, learningPlanId, recommendedTaskId, studyAction, onStudyTask }) {
  const tasks = group.tasks || [];
  const defaultSelected = useMemo(() => {
    if (!tasks.length) return null;
    const rec = tasks.find((t) => t.taskId === recommendedTaskId);
    if (rec) return rec.taskId;
    const next = tasks.find(
      (t) => t.status !== 'PASSED' && t.status !== 'SKIPPED' && t.status !== 'LOCKED',
    );
    return (next || tasks[0]).taskId;
  }, [tasks, recommendedTaskId]);

  const [pickedId, setPickedId] = useState(null);
  const selectedId = pickedId ?? defaultSelected;
  const selected = tasks.find((t) => t.taskId === selectedId) || null;
  const mapShellRef = useRef(null);
  const selectedNodeRef = useRef(null);

  useEffect(() => {
    const shell = mapShellRef.current;
    const node = selectedNodeRef.current;
    if (!shell || !node) return;
    const shellRect = shell.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const offset =
      nodeRect.top - shellRect.top - shellRect.height / 2 + nodeRect.height / 2;
    shell.scrollTo({ top: shell.scrollTop + offset, behavior: 'smooth' });
  }, [selectedId]);

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
        Bấm ải trên bản đồ để xem chi tiết
        {group.passAccuracy != null && (
          <>
            {' '}
            · cần ≥{group.passAccuracy}% để vượt
            <InfoTip text={TERM_TIPS.passThreshold} />
          </>
        )}
        .
      </p>

      {(group.partResources || []).length > 0 && (
        <div className={cx('resourceBox')}>
          <div className={cx('resourceInfo')}>
            <div className={cx('resourceLabel')}>
              <BookOpen size={14} /> Giới thiệu chặng (đọc trước)
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
        <div ref={mapShellRef} className={cx('stageMapShell')}>
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
                nodeRef={task.taskId === selectedId ? selectedNodeRef : undefined}
                onSelect={() => setPickedId(task.taskId)}
              />
            ))}

            <span
              className={cx('stageFlag', 'stageFlagEnd')}
              style={{
                left: `${nodeX(tasks.length - 1)}%`,
                top: `${nodeY(tasks.length - 1) + 42}px`,
              }}
            >
              <Flag size={14} /> Hết chặng
            </span>
          </div>
        </div>

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
      </div>
    </div>
  );
}

function StageNode({ task, index, isSelected, isRecommended, onSelect, nodeRef }) {
  const isCapstone = isCapstoneTask(task);
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
      ref={nodeRef}
      type="button"
      className={cx('stageNodeWrap')}
      style={{ left: `${nodeX(index)}%`, top: `${nodeY(index)}px` }}
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`Ải ${task.taskOrder}: ${taskDisplayName(task)}`}
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
      <span
        className={cx('stageNodeLabel', `label${labelSide(index) === 'left' ? 'Left' : 'Right'}`, {
          stageNodeLabelActive: isSelected || isRecommended,
        })}
      >
        {isCapstone ? 'Tổng hợp' : shortMapLabel(taskDisplayName(task))}
      </span>
    </button>
  );
}

function TaskDetailCard({ task, learningPlanId, isRecommended, studyAction, onStudyTask }) {
  const status = TASK_STATUS[task.status] || TASK_STATUS.ACTIVE;
  const isCapstone = isCapstoneTask(task);
  const isPassed = task.status === 'PASSED';
  const isLocked = task.status === 'LOCKED';
  const canStudy = task.status !== 'SKIPPED' && !isLocked;
  const resource = task.studyResource;
  const current = taskCurrentAccuracy(task);
  const gap = taskGapToPass(task);
  const unpassedAttempts = taskUnpassedAttempts(task);
  const nearPass = !isPassed && gap != null && gap > 0 && gap <= NEAR_PASS_GAP;

  const hasAttempted = (task.attemptCount ?? 0) > 0;
  const studyLabel = isPassed ? 'Luyện lại' : hasAttempted ? 'Thử lại' : 'Bắt đầu';

  const studyButton =
    studyAction === 'button' ? (
      <button
        type="button"
        className={cx('btn', 'btnPrimary', 'stageCta')}
        disabled={!canStudy}
        onClick={() => onStudyTask?.(task.taskId)}
      >
        {studyLabel}
      </button>
    ) : (
      <Link
        to={`/learning-plans/${learningPlanId}/study?taskId=${task.taskId}`}
        className={cx('btn', 'btnPrimary', 'stageCta')}
        aria-disabled={!canStudy}
        onClick={(e) => {
          if (!canStudy) e.preventDefault();
        }}
      >
        {studyLabel}
      </Link>
    );

  return (
    <div className={cx('stagePanelCard', { stagePanelCardCapstone: isCapstone })}>
      <div className={cx('stagePanelHead')}>
        <span className={cx('stagePanelKicker')}>
          {isCapstone ? 'Tổng hợp cuối chặng' : `Ải ${task.taskOrder}`}
        </span>
        <span className={cx('badge', status.variant)}>{status.text}</span>
      </div>

      <h5 className={cx('stagePanelTitle')}>{taskDisplayName(task)}</h5>

      <div className={cx('taskBadges')}>
        {isRecommended && (
          <span className={cx('chip', 'chipPrimary')}>
            <Sparkles size={12} /> Nên làm tiếp
          </span>
        )}
        {nearPass && <span className={cx('chip', 'chipWarning')}>Sắp vượt · còn {gap}%</span>}
        {unpassedAttempts > 0 && (
          <span className={cx('chip', 'chipMuted')}>
            Đã làm {unpassedAttempts} lượt · chưa qua
          </span>
        )}
      </div>

      {!isLocked && !isCapstone && (resource?.url || resource?.resourceId) && (
        <div className={cx('stagePanelResource')}>
          <div className={cx('resourceLabel')}>
            <BookOpen size={14} /> Tài liệu nên đọc trước
          </div>
          <RecoveryResourceLink resource={resource} className={cx('resourceLink')}>
            {resource.title || resource.originalFileName || 'Mở tài liệu'}
          </RecoveryResourceLink>
        </div>
      )}

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
              <span>Chưa luyện · cần ≥{task.passAccuracy}%</span>
            ) : gap === 0 ? (
              <span className={cx('successText')}>
                <strong>{current}%</strong> · đã đạt ngưỡng
              </span>
            ) : (
              <span>
                <strong>{current}%</strong> · cần ≥{task.passAccuracy}%
                {gap != null ? ` · còn ${gap}%` : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {(task.wrongCountAtDiagnosis != null || task.targetQuestionCount != null) && (
        <div className={cx('taskStats')}>
          {task.wrongCountAtDiagnosis != null && (
            <span className={cx('metaChip')}>Sai {task.wrongCountAtDiagnosis} lúc chẩn đoán</span>
          )}
          {task.targetQuestionCount != null && (
            <span className={cx('metaChip')}>{task.targetQuestionCount} câu / lượt</span>
          )}
        </div>
      )}

      {isLocked ? (
        <p className={cx('muted', 'small', 'lockHint')}>
          {isCapstone
            ? 'Vượt hết ải phía trên để mở tổng hợp.'
            : 'Hoàn thành các ải trước để mở ải này.'}
        </p>
      ) : (
        <div className={cx('taskActions')}>
          {studyButton}
          {task.attemptCount > 0 && (
            <Link
              to={`/learning-plans/${learningPlanId}/tasks/${task.taskId}/history`}
              className={cx('btn', 'btnOutline', 'btnSm')}
            >
              <History size={14} /> Lịch sử
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
        </div>
      )}
    </div>
  );
}

export default PlanPartTaskList;
