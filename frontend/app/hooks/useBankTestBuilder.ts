'use client';

import { useState } from 'react';
import { getQuestionsByPart } from '@/app/apis/questionApi';
import type { QuestionResponse } from '@/app/types';

export const SELECTION_MODES = {
  MANUAL: 'manual',
  RANDOM: 'random',
  RANDOM_BY_COLLECTION: 'random_by_collection',
  SEQUENTIAL: 'sequential',
} as const;

export type SelectionMode = (typeof SELECTION_MODES)[keyof typeof SELECTION_MODES];

export type BankQuestion = QuestionResponse & {
  id?: string;
  passageId?: string | null;
};

export interface PartConfig {
  mode: SelectionMode;
  randomCount: string;
  fromIndex: string;
  toIndex: string;
  selectedIds: string[];
  bankQuestions: BankQuestion[];
  loading: boolean;
  expanded: boolean;
}

export type PartConfigMap = Record<string, PartConfig>;

export interface BankLoadParams {
  classId?: string;
  chapterId?: string;
  bank?: string;
}

export interface PassageGroup {
  groupKey: string;
  passageId: string | null;
  questions: BankQuestion[];
}

export const defaultPartConfig = (): PartConfig => ({
  mode: SELECTION_MODES.RANDOM,
  randomCount: '',
  fromIndex: '',
  toIndex: '',
  selectedIds: [],
  bankQuestions: [],
  loading: false,
  expanded: true,
});

export const groupQuestionsByPassage = (questions: BankQuestion[] | null | undefined): PassageGroup[] => {
  if (!questions?.length) return [];
  const map = new Map<string, PassageGroup>();
  questions.forEach((q) => {
    const id = q.questionId ?? q.id;
    const passageId = q.passageId ?? q.passage?.passageId ?? null;
    const groupKey = passageId != null ? `passage-${passageId}` : `no-passage-${id}`;
    if (!map.has(groupKey)) {
      map.set(groupKey, { groupKey, passageId, questions: [] });
    }
    map.get(groupKey)!.questions.push(q);
  });
  return Array.from(map.values());
};

export interface UseBankTestBuilderOptions {
  getScopedQuestions?: (cfg: PartConfig | undefined) => BankQuestion[];
}

export function useBankTestBuilder({ getScopedQuestions }: UseBankTestBuilderOptions = {}) {
  const [partConfigs, setPartConfigs] = useState<PartConfigMap>({});

  const scopeOf = (cfg: PartConfig | undefined): BankQuestion[] =>
    getScopedQuestions ? getScopedQuestions(cfg) : cfg?.bankQuestions || [];

  const updatePartConfig = (examPartId: string, field: string, value: any) => {
    setPartConfigs((prev) => ({
      ...prev,
      [examPartId]: { ...prev[examPartId], [field]: value } as PartConfig,
    }));
  };

  const togglePartExpanded = (examPartId: string) => {
    setPartConfigs((prev) => ({
      ...prev,
      [examPartId]: { ...prev[examPartId], expanded: !prev[examPartId].expanded },
    }));
  };

  const loadQuestionsForPart = (examPartId: string, params: BankLoadParams = {}) => {
    setPartConfigs((prev) => ({
      ...prev,
      [examPartId]: { ...prev[examPartId], loading: true },
    }));
    return getQuestionsByPart(examPartId, params)
      .then((data) => {
        const raw = data as any;
        const list: BankQuestion[] = Array.isArray(raw) ? raw : raw?.data ?? raw?.questions ?? [];
        setPartConfigs((prev) => ({
          ...prev,
          [examPartId]: { ...prev[examPartId], bankQuestions: list, loading: false },
        }));
      })
      .catch((err) => {
        console.error(err);
        setPartConfigs((prev) => ({
          ...prev,
          [examPartId]: { ...prev[examPartId], bankQuestions: [], loading: false },
        }));
      });
  };

  const toggleGroup = (examPartId: string, groupKey: string) => {
    const cfg = partConfigs[examPartId];
    if (!cfg) return;
    const group = groupQuestionsByPassage(scopeOf(cfg)).find((g) => g.groupKey === groupKey);
    if (!group) return;
    const ids = group.questions.map((q) => q.questionId ?? q.id).filter(Boolean) as string[];
    const selectedSet = new Set(cfg.selectedIds || []);
    const allSelected = ids.every((id) => selectedSet.has(id));
    if (allSelected) ids.forEach((id) => selectedSet.delete(id));
    else ids.forEach((id) => selectedSet.add(id));
    updatePartConfig(examPartId, 'selectedIds', Array.from(selectedSet));
  };

  const isGroupSelected = (examPartId: string, groupKey: string) => {
    const cfg = partConfigs[examPartId];
    if (!cfg) return false;
    const group = groupQuestionsByPassage(scopeOf(cfg)).find((g) => g.groupKey === groupKey);
    if (!group) return false;
    const ids = group.questions.map((q) => q.questionId ?? q.id).filter(Boolean) as string[];
    const selectedSet = new Set(cfg.selectedIds || []);
    return ids.length > 0 && ids.every((id) => selectedSet.has(id));
  };

  const toggleSelectAll = (examPartId: string, checked: boolean) => {
    const cfg = partConfigs[examPartId];
    if (!cfg) return;
    const ids = scopeOf(cfg).map((q) => q.questionId ?? q.id).filter(Boolean) as string[];
    updatePartConfig(examPartId, 'selectedIds', checked ? ids : []);
  };

  const getPartEffectiveCount = (examPartId: string) => {
    const cfg = partConfigs[examPartId];
    if (!cfg) return 0;
    const scoped = scopeOf(cfg);
    if (cfg.mode === SELECTION_MODES.RANDOM) {
      const n = Math.max(0, parseInt(cfg.randomCount, 10) || 0);
      return Math.min(n, scoped.length);
    }
    if (cfg.mode === SELECTION_MODES.RANDOM_BY_COLLECTION) {
      return scoped.length;
    }
    if (cfg.mode === SELECTION_MODES.SEQUENTIAL) {
      const from = Math.max(1, parseInt(cfg.fromIndex, 10) || 1);
      const to = Math.max(from, parseInt(cfg.toIndex, 10) || from);
      const maxInBank = scoped.length;
      if (from > maxInBank) return 0;
      const actualTo = Math.min(to, maxInBank);
      return actualTo - from + 1;
    }

    const scopedIds = new Set(scoped.map((q) => q.questionId ?? q.id));
    return (cfg.selectedIds || []).filter((id) => scopedIds.has(id)).length;
  };

  const hasPartWithQuestions = (part: { examPartId: string }) => {
    const cfg = partConfigs[part.examPartId];
    if (!cfg) return false;
    const scoped = scopeOf(cfg);
    if (cfg.mode === SELECTION_MODES.RANDOM) {
      const n = Math.max(0, parseInt(cfg.randomCount, 10) || 0);
      return n > 0 && scoped.length > 0;
    }
    if (cfg.mode === SELECTION_MODES.RANDOM_BY_COLLECTION) {
      return scoped.length > 0;
    }
    if (cfg.mode === SELECTION_MODES.SEQUENTIAL) {
      const from = parseInt(cfg.fromIndex, 10);
      const to = parseInt(cfg.toIndex, 10);
      return !isNaN(from) && !isNaN(to) && from > 0 && to >= from && scoped.length >= from;
    }
    return getPartEffectiveCount(part.examPartId) > 0;
  };

  return {
    partConfigs,
    setPartConfigs,
    scopeOf,
    updatePartConfig,
    togglePartExpanded,
    loadQuestionsForPart,
    toggleGroup,
    isGroupSelected,
    toggleSelectAll,
    getPartEffectiveCount,
    hasPartWithQuestions,
  };
}
