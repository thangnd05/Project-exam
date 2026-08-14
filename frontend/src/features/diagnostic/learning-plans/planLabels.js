
export const PLAN_STATUS_LABEL = {
  ACTIVE: 'Đang học',
  COMPLETED: 'Hoàn thành',
  REPLACED: 'Đã thay',
};

export const PLAN_STATUS_VARIANT = {
  ACTIVE: 'badgePrimary',
  COMPLETED: 'badgeSuccess',
  REPLACED: 'badgeMuted',
};

export const PLAN_STAGE_LABEL = {
  FOUNDATION: 'Nền tảng',
  MOCK: 'Thi thử',
};

/** Trạng thái ải (task)  dùng chung roadmap + lịch sử. */
export const TASK_STATUS = {
  PASSED: { text: 'Đã vượt', variant: 'badgeSuccess' },
  ACTIVE: { text: 'Chưa vượt', variant: 'badgePrimary' },
  LOCKED: { text: 'Chưa mở', variant: 'badgeMuted' },
  SKIPPED: { text: 'Bỏ qua', variant: 'badgeMuted' },
};

export const CAPSTONE_TYPES = new Set(['PART_CAPSTONE_1', 'PART_CAPSTONE_2']);

// Map mã noticeCode từ BE (trạng thái) sang câu chữ hiển thị.
export const PLAN_NOTICE_TEXT = {
  EMPTY_POOL_SKIPPED: 'Ải này chưa có câu hỏi nào trong kho nên đã được bỏ qua  hãy chọn ải khác.',
  EMPTY_POOL_RETRY: 'Ải này hiện chưa có câu hỏi để luyện lại. Hãy chọn ải khác.',
};

export const planNoticeText = (code) => PLAN_NOTICE_TEXT[code] || null;

export const isPracticeAttempt = (userTest) => (userTest?.practicePartIds?.length ?? 0) > 0;

export const taskStatusLabel = (status) =>
  TASK_STATUS[status]?.text || status || '—';

export const taskStatusVariant = (status) =>
  TASK_STATUS[status]?.variant || 'badgeMuted';

/** Tên hiển thị ải  capstone map từ taskType, tag lấy tên thật từ BE. */
export function taskDisplayName(task) {
  if (!task) return '—';
  if (task.taskType === 'PART_CAPSTONE_1') return 'Ải cuối chặng  lần 1';
  if (task.taskType === 'PART_CAPSTONE_2') return 'Ải cuối chặng  lần 2';
  return task.tagName || '—';
}

export function isCapstoneTask(task) {
  return CAPSTONE_TYPES.has(task?.taskType);
}

/** Câu tóm tắt cho lộ trình vừa sinh  ghép từ số liệu trong PlanResponse. */
export function buildPlanSummary(plan) {
  const target = plan.targetScore == null ? 'đạt mục tiêu' : `đạt ${plan.targetScore} điểm`;
  return `Readiness ${plan.baselineReadiness ?? 0}%. ${plan.totalTasks ?? 0} ải cho Part chưa đạt mục tiêu, để ${target}.`;
}

/** Câu thông báo sau khi sinh lại theo mục tiêu mới  nói rõ giữ được gì, phải làm lại gì. */
export function buildResyncMessage(plan) {
  if (plan?.targetAchieved) {
    return 'Bạn đã đạt mục tiêu mới  lộ trình hiện tại được đánh dấu hoàn thành, chưa cần lộ trình mới.';
  }
  const reopened = plan?.reopenedTasks ?? 0;
  if (reopened > 0) {
    return `Đã cập nhật theo mục tiêu mới  ${reopened} ải phải vượt lại vì ngưỡng mới cao hơn.`;
  }
  return 'Đã cập nhật theo mục tiêu mới  tiến độ giữ nguyên.';
}

export const planStatusLabel = (status) => PLAN_STATUS_LABEL[status] || status || '—';

export const planStatusVariant = (status) => PLAN_STATUS_VARIANT[status] || 'badgeMuted';

export const planStageLabel = (stage) => PLAN_STAGE_LABEL[stage] || stage || '—';
