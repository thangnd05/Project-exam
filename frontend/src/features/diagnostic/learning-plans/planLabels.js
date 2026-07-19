// Nhãn tiếng Việt + biến thể badge cho Trạng thái & Giai đoạn của learning plan.
// Tập trung 1 chỗ để mọi trang dùng chung (tránh mỗi file khai báo lại — dễ lệch chữ).

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

/** Nhãn trạng thái plan; không khớp thì trả về chính giá trị gốc. */
export const planStatusLabel = (status) => PLAN_STATUS_LABEL[status] || status || '—';

/** Class badge theo trạng thái plan (dùng với cx). */
export const planStatusVariant = (status) => PLAN_STATUS_VARIANT[status] || 'badgeMuted';

/** Nhãn giai đoạn plan; null -> '—', enum lạ -> giữ nguyên để không mất thông tin. */
export const planStageLabel = (stage) => PLAN_STAGE_LABEL[stage] || stage || '—';
