
export function taskUnpassedAttempts(task) {
  if (task?.status === 'PASSED') return 0;
  return task?.attemptCount ?? 0;
}

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
