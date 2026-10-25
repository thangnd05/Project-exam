
import type { useTranslations } from 'next-intl';
import { PlanTaskType, UserTestMode } from '@/app/enums';
import type { PlanResponse, PlanTaskResponse } from '@/app/types';

export type LearningPlansT = ReturnType<typeof useTranslations<'LearningPlans'>>;

export const PLAN_STATUS_LABEL = {
  ACTIVE: 'labels.planStatus.active',
  COMPLETED: 'labels.planStatus.completed',
  REPLACED: 'labels.planStatus.replaced',
} as const satisfies Record<string, Parameters<LearningPlansT>[0]>;

export const PLAN_STATUS_VARIANT: Record<string, string> = {
  ACTIVE: 'badgePrimary',
  COMPLETED: 'badgeSuccess',
  REPLACED: 'badgeMuted',
};

export const PLAN_STAGE_LABEL = {
  FOUNDATION: 'labels.planStage.foundation',
  MOCK: 'labels.planStage.mock',
} as const satisfies Record<string, Parameters<LearningPlansT>[0]>;

export type TaskStatusLabelKey =
  | 'labels.taskStatus.passed'
  | 'labels.taskStatus.active'
  | 'labels.taskStatus.locked'
  | 'labels.taskStatus.skipped';

export const TASK_STATUS: Record<string, { labelKey: TaskStatusLabelKey; variant: string }> = {
  PASSED: { labelKey: 'labels.taskStatus.passed', variant: 'badgeSuccess' },
  ACTIVE: { labelKey: 'labels.taskStatus.active', variant: 'badgePrimary' },
  LOCKED: { labelKey: 'labels.taskStatus.locked', variant: 'badgeMuted' },
  SKIPPED: { labelKey: 'labels.taskStatus.skipped', variant: 'badgeMuted' },
};

export const CAPSTONE_TYPES: Set<string> = new Set(['PART_CAPSTONE_1', 'PART_CAPSTONE_2']);

export const PLAN_NOTICE_TEXT = {
  EMPTY_POOL_SKIPPED: 'labels.notice.emptyPoolSkipped',
  EMPTY_POOL_RETRY: 'labels.notice.emptyPoolRetry',
} as const satisfies Record<string, Parameters<LearningPlansT>[0]>;

const lookup = <M extends Record<string, string>>(map: M, code?: string | null): M[keyof M] | null =>
  code && Object.prototype.hasOwnProperty.call(map, code) ? map[code as keyof M] : null;

export const planNoticeText = (t: LearningPlansT, code?: string | null): string | null => {
  const key = lookup(PLAN_NOTICE_TEXT, code);
  return key ? t(key) : null;
};

export const isPracticeAttempt = (
  userTest?: { practicePartIds?: string[] | null } | null,
): boolean => (userTest?.practicePartIds?.length ?? 0) > 0;

// Bài luyện tập (theo Part, không giới hạn giờ) không phản ánh trình độ thật nên không tính là thi thử.
export const isMockAttempt = (
  userTest?: { mode?: UserTestMode; practicePartIds?: string[] | null } | null,
): boolean => Boolean(userTest) && userTest!.mode !== UserTestMode.PRACTICE && !isPracticeAttempt(userTest);

export const taskStatusLabel = (t: LearningPlansT, status?: string | null): string => {
  const key = TASK_STATUS[status as string]?.labelKey;
  return key ? t(key) : status || '-';
};

export function taskDisplayName(t: LearningPlansT, task?: PlanTaskResponse | null): string {
  if (!task) return '-';
  if (task.taskType === PlanTaskType.PART_CAPSTONE_1) return t('labels.capstone1');
  if (task.taskType === PlanTaskType.PART_CAPSTONE_2) return t('labels.capstone2');
  return task.tagName || '-';
}

export function isCapstoneTask(task?: PlanTaskResponse | null): boolean {
  return CAPSTONE_TYPES.has(task?.taskType as string);
}

export function buildResyncMessage(t: LearningPlansT, plan?: PlanResponse | null): string {
  if (plan?.targetAchieved) {
    return t('labels.resync.achieved');
  }
  const reopened = plan?.reopenedTasks ?? 0;
  if (reopened > 0) {
    return t('labels.resync.reopened', { count: reopened });
  }
  return t('labels.resync.unchanged');
}

export const planStatusLabel = (t: LearningPlansT, status?: string | null): string => {
  const key = lookup(PLAN_STATUS_LABEL, status);
  return key ? t(key) : status || '-';
};

export const planStatusVariant = (status?: string | null): string => PLAN_STATUS_VARIANT[status as string] || 'badgeMuted';

export const planStageLabel = (t: LearningPlansT, stage?: string | null): string => {
  const key = lookup(PLAN_STAGE_LABEL, stage);
  return key ? t(key) : stage || '-';
};
