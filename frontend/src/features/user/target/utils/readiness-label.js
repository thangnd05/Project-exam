const READINESS_LABELS = {
  READY: 'Sẵn sàng',
  ALMOST_READY: 'Gần sẵn sàng',
  NEEDS_IMPROVEMENT: 'Cần cải thiện',
  NOT_READY: 'Chưa sẵn sàng',
};

const READINESS_CLASS = {
  READY: 'readinessReady',
  ALMOST_READY: 'readinessAlmost',
  NEEDS_IMPROVEMENT: 'readinessNeeds',
  NOT_READY: 'readinessNotReady',
};

export function getReadinessLabel(level) {
  if (!level) {
    return '—';
  }
  return READINESS_LABELS[level] || level.replace(/_/g, ' ').toLowerCase();
}

export function getReadinessClassName(level, pageCx) {
  const key = READINESS_CLASS[level] || 'readinessNotReady';
  return pageCx(key);
}
