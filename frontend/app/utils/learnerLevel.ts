export type LearnerLevel = 'BEGINNER' | 'STUDIED';

const STORAGE_KEY = 'winde:learner-level';

type LearnerLevelMap = Record<string, LearnerLevel>;

const readMap = (): LearnerLevelMap => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as LearnerLevelMap) : {};
  } catch {
    return {};
  }
};

export const getLearnerLevel = (examTypeId?: string | null): LearnerLevel | null => {
  if (!examTypeId) return null;
  return readMap()[examTypeId] ?? null;
};

export const isBeginnerLevel = (examTypeId?: string | null): boolean =>
  getLearnerLevel(examTypeId) === 'BEGINNER';

export const setLearnerLevel = (
  examTypeId: string | null | undefined,
  level: LearnerLevel,
): void => {
  if (typeof window === 'undefined' || !examTypeId) return;
  try {
    const next: LearnerLevelMap = {...readMap(), [examTypeId]: level};
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage bị chặn: bỏ qua, luồng làm bài vẫn chạy bình thường.
  }
};
