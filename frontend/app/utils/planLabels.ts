
import { PlanTaskType } from '@/app/enums';
import type { PlanResponse, PlanTaskResponse } from '@/app/types';

export const PLAN_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Đang học',
  COMPLETED: 'Hoàn thành',
  REPLACED: 'Đã thay',
};

export const PLAN_STATUS_VARIANT: Record<string, string> = {
  ACTIVE: 'badgePrimary',
  COMPLETED: 'badgeSuccess',
  REPLACED: 'badgeMuted',
};

export const PLAN_STAGE_LABEL: Record<string, string> = {
  FOUNDATION: 'Nền tảng',
  MOCK: 'Thi thử',
};

export const TASK_STATUS: Record<string, { text: string; variant: string }> = {
  PASSED: { text: 'Đã vượt', variant: 'badgeSuccess' },
  ACTIVE: { text: 'Chưa vượt', variant: 'badgePrimary' },
  LOCKED: { text: 'Chưa mở', variant: 'badgeMuted' },
  SKIPPED: { text: 'Bỏ qua', variant: 'badgeMuted' },
};

export const CAPSTONE_TYPES: Set<string> = new Set(['PART_CAPSTONE_1', 'PART_CAPSTONE_2']);

export const PLAN_NOTICE_TEXT: Record<string, string> = {
  EMPTY_POOL_SKIPPED: 'Ải này chưa có câu hỏi nào trong kho nên đã được bỏ qua  hãy chọn ải khác.',
  EMPTY_POOL_RETRY: 'Ải này hiện chưa có câu hỏi để luyện lại. Hãy chọn ải khác.',
};

export const planNoticeText = (code?: string | null): string | null =>
  PLAN_NOTICE_TEXT[code as string] || null;

export const isPracticeAttempt = (
  userTest?: { practicePartIds?: string[] | null } | null,
): boolean => (userTest?.practicePartIds?.length ?? 0) > 0;

export const taskStatusLabel = (status?: string | null): string =>
  TASK_STATUS[status as string]?.text || status || '—';

export const taskStatusVariant = (status?: string | null): string =>
  TASK_STATUS[status as string]?.variant || 'badgeMuted';

export function taskDisplayName(task?: PlanTaskResponse | null): string {
  if (!task) return '—';
  if (task.taskType === PlanTaskType.PART_CAPSTONE_1) return 'Ải cuối chặng  lần 1';
  if (task.taskType === PlanTaskType.PART_CAPSTONE_2) return 'Ải cuối chặng  lần 2';
  return task.tagName || '—';
}

export function isCapstoneTask(task?: PlanTaskResponse | null): boolean {
  return CAPSTONE_TYPES.has(task?.taskType as string);
}

export function buildPlanSummary(plan: PlanResponse): string {
  const target = plan.targetScore == null ? 'đạt mục tiêu' : `đạt ${plan.targetScore} điểm`;
  return `Readiness ${plan.baselineReadiness ?? 0}%. ${plan.totalTasks ?? 0} ải cho Part chưa đạt mục tiêu, để ${target}.`;
}

export function buildResyncMessage(plan?: PlanResponse | null): string {
  if (plan?.targetAchieved) {
    return 'Bạn đã đạt mục tiêu mới  lộ trình hiện tại được đánh dấu hoàn thành, chưa cần lộ trình mới.';
  }
  const reopened = plan?.reopenedTasks ?? 0;
  if (reopened > 0) {
    return `Đã cập nhật theo mục tiêu mới  ${reopened} ải phải vượt lại vì ngưỡng mới cao hơn.`;
  }
  return 'Đã cập nhật theo mục tiêu mới  tiến độ giữ nguyên.';
}

export const planStatusLabel = (status?: string | null): string => PLAN_STATUS_LABEL[status as string] || status || '—';

export const planStatusVariant = (status?: string | null): string => PLAN_STATUS_VARIANT[status as string] || 'badgeMuted';

export const planStageLabel = (stage?: string | null): string => PLAN_STAGE_LABEL[stage as string] || stage || '—';
