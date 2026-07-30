

export const PLAN_STATUS_LABEL = {
  ACTIVE: 'Đang học',
  COMPLETED: 'Hoàn thành',
  REPLACED: 'Đã thay',
  ABANDONED: 'Đã bỏ',
};

export const PLAN_STATUS_VARIANT = {
  ACTIVE: 'badgePrimary',
  COMPLETED: 'badgeSuccess',
  REPLACED: 'badgeMuted',
  ABANDONED: 'badgeDanger',
};

export const PLAN_STAGE_LABEL = {
  FOUNDATION: 'Nền tảng',
  MOCK: 'Thi thử',
  MIX: 'Tổng hợp',
};

export const planStatusLabel = (status) => PLAN_STATUS_LABEL[status] || status || '—';

export const planStatusVariant = (status) => PLAN_STATUS_VARIANT[status] || 'badgeMuted';

export const planStageLabel = (stage) => PLAN_STAGE_LABEL[stage] || stage || '—';
