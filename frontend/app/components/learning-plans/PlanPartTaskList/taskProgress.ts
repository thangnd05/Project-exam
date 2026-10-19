type TaskLike = {
  status?: string | null;
  attemptCount?: number | null;
  bestAccuracy?: number | string | null;
  baselineAccuracy?: number | string | null;
  passAccuracy?: number | null;
};

export function taskUnpassedAttempts(task: TaskLike | null | undefined): number {
  if (task?.status === 'PASSED') return 0;
  return task?.attemptCount ?? 0;
}

export function taskCurrentAccuracy(task: TaskLike | null | undefined): number | null {
  const v = task?.bestAccuracy ?? task?.baselineAccuracy;
  return v == null ? null : Math.round(Number(v));
}

export function taskGapToPass(task: TaskLike | null | undefined): number | null {
  const cur = taskCurrentAccuracy(task);
  const pass = task?.passAccuracy;
  if (cur == null || pass == null) return null;
  return Math.max(0, pass - cur);
}
