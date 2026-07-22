export const STUCK_FAIL_THRESHOLD = 3;

export function taskCurrentAccuracy(task) {
  const v = task?.bestAccuracy ?? task?.baselineAccuracy;
  return v == null ? null : Math.round(Number(v));
}

export function taskGapToPass(task) {
  const cur = taskCurrentAccuracy(task);
  const pass = task?.passAccuracy;
  if (cur == null || pass == null) return null;
  return Math.max(0, pass - cur);
}

export function isTaskStuck(task) {
  return (task?.consecutiveFails ?? 0) >= STUCK_FAIL_THRESHOLD;
}

export function formatGapToPass(task) {
  const cur = taskCurrentAccuracy(task);
  const pass = task?.passAccuracy;
  if (pass == null) return null;
  if (cur == null) return `cần ≥ ${pass}%`;
  const gap = Math.max(0, pass - cur);
  if (gap === 0) return `${cur}% → ${pass}% · đã tới ngưỡng`;
  return `${cur}% → ${pass}% · còn ${gap}%`;
}
