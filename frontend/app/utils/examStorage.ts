import type { ExamUserAnswers } from '@/app/components/exam-layout/examLayoutTypes';

const ID_PREFIX = 'userTest-';
const STATE_PREFIX = 'userTestState-';
const TTL_MS = 24 * 60 * 60 * 1000;

export type ExamSessionState = {
  userTestId: string | null;
  userAnswers: ExamUserAnswers;
  startedAt: string | null;
  currentStepIndex: number;
  maxStepIndex: number;
  lastSavedAt: number;
};

const store = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const isExpired = (lastSavedAt: unknown): boolean =>
  typeof lastSavedAt !== 'number' || Date.now() - lastSavedAt > TTL_MS;

export const clearExamSession = (sessionKey: string): void => {
  const storage = store();
  if (!storage) return;
  try {
    storage.removeItem(`${ID_PREFIX}${sessionKey}`);
    storage.removeItem(`${STATE_PREFIX}${sessionKey}`);
  } catch {
  }
};

export const readExamSessionId = (sessionKey: string): string | null => {
  try {
    return store()?.getItem(`${ID_PREFIX}${sessionKey}`) || null;
  } catch {
    return null;
  }
};

export const writeExamSessionId = (sessionKey: string, userTestId: string): void => {
  try {
    store()?.setItem(`${ID_PREFIX}${sessionKey}`, userTestId);
  } catch {
  }
};

export const readExamSessionState = (sessionKey: string): ExamSessionState | null => {
  let raw: string | null = null;
  try {
    raw = store()?.getItem(`${STATE_PREFIX}${sessionKey}`) || null;
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: Partial<ExamSessionState> | null = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }

  if (!parsed || typeof parsed !== 'object' || isExpired(parsed.lastSavedAt)) {
    clearExamSession(sessionKey);
    return null;
  }

  const step = Number.isInteger(parsed.currentStepIndex) ? (parsed.currentStepIndex as number) : 0;
  const maxStep = Number.isInteger(parsed.maxStepIndex) ? (parsed.maxStepIndex as number) : step;

  return {
    userTestId: typeof parsed.userTestId === 'string' ? parsed.userTestId : null,
    userAnswers:
      parsed.userAnswers && typeof parsed.userAnswers === 'object' ? parsed.userAnswers : {},
    startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : null,
    currentStepIndex: step,
    maxStepIndex: Math.max(step, maxStep),
    lastSavedAt: parsed.lastSavedAt as number,
  };
};

export const writeExamSessionState = (
  sessionKey: string,
  state: Omit<ExamSessionState, 'lastSavedAt'>,
): void => {
  try {
    store()?.setItem(
      `${STATE_PREFIX}${sessionKey}`,
      JSON.stringify({ ...state, lastSavedAt: Date.now() }),
    );
  } catch {
  }
};

export const pruneExpiredExamSessions = (): void => {
  const storage = store();
  if (!storage) return;
  try {
    const staleKeys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key || !key.startsWith(STATE_PREFIX)) continue;
      let lastSavedAt: unknown = null;
      try {
        lastSavedAt = JSON.parse(storage.getItem(key) || 'null')?.lastSavedAt;
      } catch {
        lastSavedAt = null;
      }
      if (isExpired(lastSavedAt)) staleKeys.push(key.slice(STATE_PREFIX.length));
    }
    staleKeys.forEach(clearExamSession);
  } catch {
  }
};
