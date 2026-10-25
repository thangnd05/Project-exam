'use client';

import Link from '@/app/i18n/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Lock,
  Trophy,
} from 'lucide-react';
import RecoveryResourceLink from '@/app/features/resources/RecoveryResourceLink/RecoveryResourceLink';
import InfoTip from '@/app/components/InfoTip/InfoTip';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import { taskCurrentAccuracy, taskGapToPass, taskUnpassedAttempts } from '@/app/features/learning-plans/PlanPartTaskList/taskProgress';
import { TaskStatus } from '@/app/enums';
import type { PlanPartGroupResponse, PlanTaskResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import {
  CAPSTONE_TYPES,
  TASK_STATUS,
  isCapstoneTask,
  taskDisplayName,
} from '@/app/features/learning-plans/planLabels';

const cx = classNames.bind(styles);

const NEAR_PASS_GAP = 10;

const NODE_X = [50, 62, 50, 38];
const ROW_STEP = 108;
const MAP_TOP = 56;
const MAP_BOTTOM = 88;

function nodeX(i: number) {
  return NODE_X[i % NODE_X.length];
}

function nodeY(i: number) {
  return MAP_TOP + i * ROW_STEP;
}

function labelSide(i: number) {
  return nodeX(i) >= 50 ? 'right' : 'left';
}

function shortMapLabel(name?: string, max = 48) {
  if (!name) return '';
  // Keep kebab-case names (Amazon-Aurora-...). Only drop a subtitle after
  // " - ", an en/em dash, or "(". Then turn remaining hyphens into spaces.
  const primary = name.split(/\s+[-–—]\s+|\s*[–—]\s*|\s*\(/)[0].trim();
  const readable = primary.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  if (readable.length <= max) return readable;
  const cut = readable.slice(0, max - 1).replace(/\s+\S*$/, '');
  return `${cut || readable.slice(0, max - 1)}…`;
}

function resourceTitle(fallback: string, name?: string) {
  if (!name) return fallback;
  // "VPC-Traffic-Control.md" -> "VPC Traffic Control"
  return name.replace(/\.(md|pdf|docx?|txt)$/i, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildPathD(from: number, to: number) {
  if (to <= from) return '';
  let d = `M ${nodeX(from)} ${nodeY(from)}`;
  for (let i = from + 1; i <= to; i += 1) {
    const mid = ROW_STEP / 2;
    d += ` C ${nodeX(i - 1)} ${nodeY(i - 1) + mid}, ${nodeX(i)} ${nodeY(i) - mid}, ${nodeX(i)} ${nodeY(i)}`;
  }
  return d;
}

function taskDotState(task: PlanTaskResponse) {
  if (task.status === TaskStatus.PASSED) return 'partDotPassed';
  return 'partDotPending';
}

function lastPassedIndex(tasks: PlanTaskResponse[]) {
  let last = -1;
  tasks.forEach((t, i) => {
    if (t.status === TaskStatus.PASSED) last = i;
  });
  return last;
}

function defaultOpenParts(groups: PlanPartGroupResponse[], recommendedTaskId?: string): Set<string> {
  if (!groups.length) return new Set();
  if (recommendedTaskId) {
    const hit = groups.find((g) => (g.tasks || []).some((t) => t.taskId === recommendedTaskId));
    if (hit) return new Set([hit.examPartId]);
  }
  const firstUnfinished = groups.find((g) => g.passedTasksInPart < g.totalTasksInPart);
  return new Set([(firstUnfinished || groups[0]).examPartId]);
}

type RoadmapHeading = {
  title: string;
  tip?: string;
  description?: string;
};

type PlanPartTaskListProps = {
  partGroups?: PlanPartGroupResponse[];
  learningPlanId?: string;
  recommendedTaskId?: string;
  studyAction?: 'link' | 'button';
  onStudyTask?: (taskId: string) => void;
  roadmapHeading?: RoadmapHeading | null;
};

function PlanPartTaskList({
  partGroups = [],
  learningPlanId,
  recommendedTaskId,
  studyAction = 'link',
  onStudyTask,
  roadmapHeading = null,
}: PlanPartTaskListProps) {
  const orderedGroups = partGroups;
  const fallbackOpen = useMemo(
    () => defaultOpenParts(orderedGroups, recommendedTaskId),
    [orderedGroups, recommendedTaskId],
  );

  const [openOverride, setOpenOverride] = useState<Set<string> | null>(null);
  const openIds = openOverride ?? fallbackOpen;
  const t = useTranslations('LearningPlans');

  if (!orderedGroups.length) {
    return <p className={cx('muted')}>{t('taskList.empty')}</p>;
  }

  const togglePart = (partId: string) => {
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
                <span className={cx('partCrestLabel')}>{t('taskList.stage')}</span>
                <span className={cx('partCrestNo')}>{index + 1}</span>
              </span>
              <span className={cx('partHeaderMain')}>
                <span className={cx('partGroupName')}>{group.examPartName}</span>
                <span className={cx('partHeaderMeta')}>
                  {t.rich('taskList.partMeta', {
                    passed,
                    total,
                    strong: (chunks) => <strong>{chunks}</strong>,
                  })}
                  {group.passAccuracy != null && ` · ${t('taskList.threshold', { pass: group.passAccuracy })}`}
                </span>
                <span className={cx('partDots')}>
                  {(group.tasks || []).map((t) => (
                    <span
                      key={t.taskId}
                      className={cx('partDot', taskDotState(t), {
                        partDotCapstone: CAPSTONE_TYPES.has(t.taskType as string),
                      })}
                    />
                  ))}
                </span>
              </span>
              {done && (
                <span className={cx('partDoneBadge')}>
                  {t('taskList.completed')}
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

type StageMapProps = {
  group: PlanPartGroupResponse;
  learningPlanId?: string;
  recommendedTaskId?: string;
  studyAction?: 'link' | 'button';
  onStudyTask?: (taskId: string) => void;
};

function StageMap({ group, learningPlanId, recommendedTaskId, studyAction, onStudyTask }: StageMapProps) {
  const tasks: PlanTaskResponse[] = group.tasks || EMPTY_LIST;
  const defaultSelected = useMemo(() => {
    if (!tasks.length) return null;
    const rec = tasks.find((t) => t.taskId === recommendedTaskId);
    if (rec) return rec.taskId;
    const next = tasks.find(
      (t) => t.status !== TaskStatus.PASSED && t.status !== TaskStatus.SKIPPED && t.status !== TaskStatus.LOCKED,
    );
    return (next || tasks[0]).taskId;
  }, [tasks, recommendedTaskId]);

  const [pickedId, setPickedId] = useState<string | null>(null);
  const selectedId = pickedId ?? defaultSelected;
  const selected = tasks.find((t) => t.taskId === selectedId) || null;
  const mapShellRef = useRef<HTMLDivElement>(null);
  const selectedNodeRef = useRef<HTMLButtonElement>(null);
  const t = useTranslations('LearningPlans');

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
        <p className={cx('muted')}>{t('taskList.stageEmpty')}</p>
      </div>
    );
  }

  const height = nodeY(tasks.length - 1) + MAP_BOTTOM;
  const pathD = buildPathD(0, tasks.length - 1);
  const donePathD = buildPathD(0, lastPassedIndex(tasks));

  return (
    <div className={cx('partBody')}>
      <p className={cx('partGroupHint')}>
        {t('taskList.hint')}
        {group.passAccuracy != null && (
          <>
            {' '}
            · {t('taskList.needToPass', { pass: group.passAccuracy })}
            <InfoTip text={t('termTips.passThreshold')} />
          </>
        )}
        .
      </p>

      {(group.partResources || []).length > 0 && (
        <div className={cx('resourceBox')}>
          <div className={cx('resourceInfo')}>
            <div className={cx('resourceLabel')}>
              {t('taskList.resourceIntro')}
              <span className={cx('resourceCount')}>
                {t('taskList.resourceCount', { count: group.partResources!.length })}
              </span>
            </div>
            <div className={cx('resourceGrid')}>
              {group.partResources!.map((r, i) => (
                <RecoveryResourceLink key={r.resourceId} resource={r} className={cx('resourceTile')}>
                  <span className={cx('resourceTileNo')}>{i + 1}</span>
                  <span className={cx('resourceTileBody')}>
                    <span className={cx('resourceTileTitle')}>
                      {resourceTitle(t('common.openResource'), r.title || r.originalFileName)}
                    </span>
                    {r.description && <span className={cx('resourceTileDesc')}>{r.description}</span>}
                  </span>
                  <ArrowUpRight size={14} className={cx('resourceTileIcon')} />
                </RecoveryResourceLink>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={cx('stageLayout')}>
        <div ref={mapShellRef} className={cx('stageMapShell')}>
          <div className={cx('stageMap')} style={{ height: `${height}px` }}>
            <span className={cx('stageFlag', 'stageFlagStart')}>{t('taskList.start')}</span>

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
              {t('taskList.end')}
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

type StageNodeProps = {
  task: PlanTaskResponse;
  index: number;
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: () => void;
  nodeRef?: React.Ref<HTMLButtonElement>;
};

function StageNode({ task, index, isSelected, isRecommended, onSelect, nodeRef }: StageNodeProps) {
  const t = useTranslations('LearningPlans');
  const isCapstone = isCapstoneTask(task);
  const isPassed = task.status === TaskStatus.PASSED;
  const isLocked = task.status === TaskStatus.LOCKED;
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
      aria-label={t('taskList.nodeAria', { order: task.taskOrder ?? '', name: taskDisplayName(t, task) })}
    >
      {isRecommended && <span className={cx('stagePin')}>{t('taskList.youAreHere')}</span>}
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
        {isCapstone ? t('taskList.capstoneShort') : shortMapLabel(taskDisplayName(t, task))}
      </span>
    </button>
  );
}

type TaskDetailCardProps = {
  task: PlanTaskResponse;
  learningPlanId?: string;
  isRecommended: boolean;
  studyAction?: 'link' | 'button';
  onStudyTask?: (taskId: string) => void;
};

function TaskDetailCard({ task, learningPlanId, isRecommended, studyAction, onStudyTask }: TaskDetailCardProps) {
  const t = useTranslations('LearningPlans');
  const status = TASK_STATUS[task.status as string] || TASK_STATUS.ACTIVE;
  const isCapstone = isCapstoneTask(task);
  const isPassed = task.status === TaskStatus.PASSED;
  const isLocked = task.status === TaskStatus.LOCKED;
  const canStudy = task.status !== TaskStatus.SKIPPED && !isLocked;
  const resource = task.studyResource;
  const current = taskCurrentAccuracy(task);
  const gap = taskGapToPass(task);
  const unpassedAttempts = taskUnpassedAttempts(task);
  const nearPass = !isPassed && gap != null && gap > 0 && gap <= NEAR_PASS_GAP;

  const hasAttempted = (task.attemptCount ?? 0) > 0;
  const studyLabel = isPassed
    ? t('taskList.retake')
    : hasAttempted
      ? t('common.retry')
      : t('taskList.begin');

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
        href={`/learning-plans/${learningPlanId}/study?taskId=${task.taskId}`}
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
          {isCapstone ? t('taskList.capstoneKicker') : t('taskList.taskKicker', { order: task.taskOrder ?? '' })}
        </span>
        <span className={cx('badge', status.variant)}>{t(status.labelKey)}</span>
      </div>

      <h5 className={cx('stagePanelTitle')}>{taskDisplayName(t, task)}</h5>

      <div className={cx('taskBadges')}>
        {isRecommended && (
          <span className={cx('chip', 'chipPrimary')}>
            {t('taskList.recommended')}
          </span>
        )}
        {nearPass && <span className={cx('chip', 'chipWarning')}>{t('taskList.nearPass', { gap })}</span>}
        {unpassedAttempts > 0 && (
          <span className={cx('chip', 'chipMuted')}>
            {t('taskList.unpassedAttempts', { count: unpassedAttempts })}
          </span>
        )}
      </div>

      {!isLocked && !isCapstone && (resource?.url || resource?.resourceId) && (
        <div className={cx('stagePanelResource')}>
          <div className={cx('resourceLabel')}>
            {t('taskList.readFirst')}
          </div>
          <RecoveryResourceLink resource={resource} className={cx('resourceLink')}>
            {resource.title || resource.originalFileName || t('common.openResource')}
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
              <span>{t('taskList.meterNotPracticed', { pass: task.passAccuracy })}</span>
            ) : gap === 0 ? (
              <span className={cx('successText')}>
                {t.rich('taskList.meterReached', { current, strong: (chunks) => <strong>{chunks}</strong> })}
              </span>
            ) : (
              <span>
                {t.rich('taskList.meterNeed', {
                  current,
                  pass: task.passAccuracy,
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
                {gap != null ? ` · ${t('taskList.meterGap', { gap })}` : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {(task.wrongCountAtDiagnosis != null || task.targetQuestionCount != null) && (
        <div className={cx('taskStats')}>
          {task.wrongCountAtDiagnosis != null && (
            <span className={cx('metaChip')}>
              {t('taskList.wrongAtDiagnosis', { count: task.wrongCountAtDiagnosis })}
            </span>
          )}
          {task.targetQuestionCount != null && (
            <span className={cx('metaChip')}>
              {t('taskList.perAttempt', { count: task.targetQuestionCount })}
            </span>
          )}
        </div>
      )}

      {isLocked ? (
        <p className={cx('muted', 'small', 'lockHint')}>
          {isCapstone
            ? t('taskList.lockedCapstone')
            : t('taskList.locked')}
        </p>
      ) : (
        <div className={cx('taskActions')}>
          {studyButton}
          {(task.attemptCount ?? 0) > 0 && (
            <Link
              href={`/learning-plans/${learningPlanId}/tasks/${task.taskId}/history`}
              className={cx('btn', 'btnOutline', 'btnSm')}
            >
              {t('taskList.history')}
            </Link>
          )}
          {isPassed && (
            <Link
              href={`/learning-plans/${learningPlanId}/tasks/${task.taskId}/result`}
              className={cx('btn', 'btnOutline', 'btnSm')}
            >
              {t('taskList.explain')}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default PlanPartTaskList;
