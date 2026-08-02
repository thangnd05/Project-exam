

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

// Map mã noticeCode từ BE (trạng thái) sang câu chữ hiển thị.
export const PLAN_NOTICE_TEXT = {
  EMPTY_POOL_SKIPPED: 'Ải này chưa có câu hỏi nào trong kho nên đã được bỏ qua — hãy chọn ải khác.',
  EMPTY_POOL_RETRY: 'Ải này hiện chưa có câu hỏi để luyện lại. Hãy chọn ải khác.',
};

export const planNoticeText = (code) => PLAN_NOTICE_TEXT[code] || null;

/** Câu tóm tắt cho lộ trình vừa sinh — ghép từ số liệu trong PlanResponse. */
export function buildPlanSummary(plan) {
  const target = plan.targetScore == null ? 'đạt mục tiêu' : `đạt ${plan.targetScore} điểm`;
  return `Readiness ${plan.baselineReadiness ?? 0}%. ${plan.totalTasks ?? 0} ải cho Part chưa đạt mục tiêu — ~${plan.estimatedDaysRemaining ?? 0} ngày, để ${target}.`;
}

export const planStatusLabel = (status) => PLAN_STATUS_LABEL[status] || status || '—';

export const planStatusVariant = (status) => PLAN_STATUS_VARIANT[status] || 'badgeMuted';

export const planStageLabel = (stage) => PLAN_STAGE_LABEL[stage] || stage || '—';
