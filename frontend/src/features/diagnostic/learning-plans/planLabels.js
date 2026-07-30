

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

export const planStatusLabel = (status) => PLAN_STATUS_LABEL[status] || status || '—';

export const planStatusVariant = (status) => PLAN_STATUS_VARIANT[status] || 'badgeMuted';

export const planStageLabel = (stage) => PLAN_STAGE_LABEL[stage] || stage || '—';
