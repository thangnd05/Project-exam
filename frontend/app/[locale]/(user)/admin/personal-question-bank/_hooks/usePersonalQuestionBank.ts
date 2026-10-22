'use client';

import { useMemo, useState } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyClassBankCount,
  getMyClassBankQuestions,
  getQuestionsByPart,
} from '@/app/apis/questionApi';
import { getMyClasses } from '@/app/apis/classApi';
import { getChaptersByClass } from '@/app/apis/chapterApi';
import { getQuestionCollections } from '@/app/apis/questionCollectionApi';
import {
  getCollectionWithDescendantIds,
  isParentCollection,
} from '@/app/features/tests/collectionTree';
import type {
  ChapterResponse,
  ClassSimpleResponse,
  ExamPartResponse,
  QuestionCollectionResponse,
  QuestionResponse,
} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import {questionCollectionKeys, classChapterKeys} from '@/app/configs/queryKeys';

export const BANK_SCOPE = {
  ADMIN: 'admin',
  PERSONAL: 'personal',
  CLASS: 'class',
} as const;

export type BankScope = (typeof BANK_SCOPE)[keyof typeof BANK_SCOPE];

export const questionBankKeys = {
  collections: questionCollectionKeys.all,
  myClasses: ['question-bank', 'my-classes'],
  chapters: classChapterKeys.byClass,
  chapterCount: (classId?: string, chapterId?: string) => ['question-bank', 'chapter-count', classId, chapterId],
  chapterQuestions: (classId?: string, chapterId?: string) => ['question-bank', 'chapter-questions', classId, chapterId],
  partQuestions: (partId?: string, scope?: string) => ['question-bank', 'part-questions', partId, scope],
};

// API có thể trả mảng trực tiếp hoặc bọc trong object ({ data } / { content } / ...): lấy mảng đầu tiên tìm thấy.
const listFrom = <T,>(payload: unknown, keys: string[]): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  const obj = payload as Record<string, unknown> | null | undefined;
  for (const key of keys) {
    const value = obj?.[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
};

const normalizeCollections = (data: unknown): QuestionCollectionResponse[] =>
  listFrom(data, ['data', 'content']);

const normalizeMyClasses = (result: unknown): ClassSimpleResponse[] =>
  listFrom(result, ['classes']);

const normalizeChapters = (raw: unknown): ChapterResponse[] =>
  listFrom(raw, ['data']);

const normalizePartQuestions = (data: unknown): QuestionBankItem[] =>
  listFrom(data, ['data', 'questions']);

const normalizeChapterQuestions = (raw: unknown): QuestionBankItem[] =>
  listFrom(raw, ['data']);

// Một số API cũ trả `id` thay cho `questionId`.
export type QuestionBankItem = QuestionResponse & { id?: string };

export type QuestionBankPartConfig = {
  expanded: boolean;
  loading: boolean;
  questions: QuestionBankItem[];
};

export type QuestionBankChapterConfig = QuestionBankPartConfig & {
  count: number | null;
};

type UsePersonalQuestionBankParams = {
  bankScope: BankScope;
  examTypeId?: string;
  selectedClassId?: string;
  examParts?: ExamPartResponse[];
  collectionFilter: string;
  includeChildCollections: boolean;
};

export function usePersonalQuestionBank({
  bankScope,
  examTypeId,
  selectedClassId,
  examParts,
  collectionFilter,
  includeChildCollections,
}: UsePersonalQuestionBankParams) {
  const queryClient = useQueryClient();
  const [expandedParts, setExpandedParts] = useState<Set<string>>(() => new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(() => new Set());

  // Đổi loại đề / nguồn thì thu gọn các part; đổi lớp / nguồn thì thu gọn các chương.
  const partsResetKey = `${bankScope}|${examTypeId ?? ''}`;
  const [expandedPartsFor, setExpandedPartsFor] = useState(partsResetKey);
  if (expandedPartsFor !== partsResetKey) {
    setExpandedPartsFor(partsResetKey);
    setExpandedParts(new Set());
  }
  const chaptersResetKey = `${bankScope}|${selectedClassId ?? ''}`;
  const [expandedChaptersFor, setExpandedChaptersFor] = useState(chaptersResetKey);
  if (expandedChaptersFor !== chaptersResetKey) {
    setExpandedChaptersFor(chaptersResetKey);
    setExpandedChapters(new Set());
  }

  const isPartScope =
    bankScope === BANK_SCOPE.PERSONAL || bankScope === BANK_SCOPE.ADMIN;

  const collectionsQuery = useQuery({
    queryKey: questionBankKeys.collections,
    queryFn: getQuestionCollections,
    select: normalizeCollections,
  });
  const collectionsList = collectionsQuery.data ?? EMPTY_LIST;

  const collectionsMap = useMemo(() => {
    const map: Record<string, string> = {};
    collectionsList.forEach((c) => {
      if (c?.collectionId) map[c.collectionId] = c.name || '(Không tên)';
    });
    return map;
  }, [collectionsList]);

  const getCollectionName = (id?: string) => {
    if (!id) return '';
    return collectionsMap[id] || '(Không xác định)';
  };

  const selectedIsParent = isParentCollection(collectionsList, collectionFilter);

  const filterByCollection = <T extends QuestionResponse>(questions: T[]): T[] => {
    if (!collectionFilter) return questions;
    if (collectionFilter === '__none__') {
      return questions.filter((q) => !q.collectionId);
    }
    if (includeChildCollections && selectedIsParent) {
      const ids = new Set(getCollectionWithDescendantIds(collectionsList, collectionFilter));
      return questions.filter((q) => ids.has(q.collectionId as string));
    }
    return questions.filter((q) => q.collectionId === collectionFilter);
  };

  const classesQuery = useQuery({
    queryKey: questionBankKeys.myClasses,
    queryFn: getMyClasses,
    select: normalizeMyClasses,
  });
  const classes = classesQuery.data ?? [];

  const partQueries = useQueries({
    queries: (isPartScope && examTypeId ? (examParts || []) : []).map((p) => ({
      queryKey: questionBankKeys.partQuestions(p.examPartId, bankScope),
      queryFn: () =>
        getQuestionsByPart(
          p.examPartId,
          bankScope === BANK_SCOPE.ADMIN ? { bank: 'admin' } : {},
        ),
      enabled: isPartScope && !!examTypeId,
      select: normalizePartQuestions,
    })),
  });

  const partConfigs = useMemo(() => {
    const map: Record<string, QuestionBankPartConfig> = {};
    (examParts || []).forEach((p, i) => {
      const q = partQueries[i];
      map[p.examPartId] = {
        expanded: expandedParts.has(p.examPartId),
        loading: q?.isLoading ?? false,
        questions: q?.data ?? EMPTY_LIST,
      };
    });
    return map;
  }, [examParts, partQueries, expandedParts]);

  const anyPartError = partQueries.some((q) => q.isError);

  const togglePartExpanded = (partId: string) => {
    setExpandedParts((prev) => {
      const next = new Set(prev);
      if (next.has(partId)) next.delete(partId);
      else next.add(partId);
      return next;
    });
  };

  const chaptersQuery = useQuery({
    queryKey: questionBankKeys.chapters(selectedClassId),
    queryFn: () => getChaptersByClass(selectedClassId as string),
    enabled: bankScope === BANK_SCOPE.CLASS && !!selectedClassId,
    select: normalizeChapters,
  });
  const chapters = chaptersQuery.data ?? EMPTY_LIST;
  const chaptersLoading = chaptersQuery.isLoading;

  const chapterCountQueries = useQueries({
    queries: chapters.map((ch) => ({
      queryKey: questionBankKeys.chapterCount(selectedClassId, ch.chapterId),
      queryFn: () =>
        getMyClassBankCount({ classId: selectedClassId, chapterId: ch.chapterId }),
      enabled: bankScope === BANK_SCOPE.CLASS && !!selectedClassId,
      select: (count: number) => (typeof count === 'number' ? count : 0),
    })),
  });

  const chapterQuestionQueries = useQueries({
    queries: chapters.map((ch) => ({
      queryKey: questionBankKeys.chapterQuestions(selectedClassId, ch.chapterId),
      queryFn: () =>
        getMyClassBankQuestions({ classId: selectedClassId, chapterId: ch.chapterId }),
      enabled:
        bankScope === BANK_SCOPE.CLASS &&
        !!selectedClassId &&
        expandedChapters.has(ch.chapterId),
      select: normalizeChapterQuestions,
    })),
  });

  const chapterConfigs = useMemo(() => {
    const map: Record<string, QuestionBankChapterConfig> = {};
    chapters.forEach((ch, i) => {
      const cq = chapterQuestionQueries[i];
      const countQ = chapterCountQueries[i];
      const hasQuestions = cq?.data !== undefined;
      const questions = cq?.data ?? [];
      const count = hasQuestions ? questions.length : (countQ?.data ?? null);
      map[ch.chapterId] = {
        expanded: expandedChapters.has(ch.chapterId),
        loading: cq?.isLoading ?? false,
        questions,
        count: count === undefined ? null : count,
      };
    });
    return map;
  }, [chapters, chapterQuestionQueries, chapterCountQueries, expandedChapters]);

  const anyChapterQuestionError = chapterQuestionQueries.some((q) => q.isError);

  // Thông báo lỗi tải dữ liệu, suy ra trực tiếp từ trạng thái các query
  // (thứ tự ưu tiên giữ như trước: lỗi ghi sau cùng thắng).
  const loadError = anyChapterQuestionError
    ? 'Không tải được câu hỏi của chương này.'
    : chaptersQuery.isError
      ? 'Không tải được danh sách chương.'
      : anyPartError
        ? 'Không tải được danh sách câu hỏi.'
        : null;

  const toggleChapterExpanded = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const invalidateAfterEdit = async ({
    editingPartId,
    editingChapterId,
  }: { editingPartId?: string | null; editingChapterId?: string | null } = {}) => {
    if (bankScope === BANK_SCOPE.CLASS && editingChapterId) {
      await queryClient.invalidateQueries({
        queryKey: questionBankKeys.chapterQuestions(selectedClassId, editingChapterId),
      });
      queryClient.invalidateQueries({
        queryKey: questionBankKeys.chapterCount(selectedClassId, editingChapterId),
      });
      return;
    }
    if (editingPartId) {
      await queryClient.invalidateQueries({
        queryKey: questionBankKeys.partQuestions(editingPartId, bankScope),
      });
    }
  };

  const invalidateAfterDelete = async ({
    partId = null,
    chapterId = null,
  }: { partId?: string | null; chapterId?: string | null } = {}) => {
    if (bankScope === BANK_SCOPE.CLASS && chapterId) {
      await queryClient.invalidateQueries({
        queryKey: questionBankKeys.chapterQuestions(selectedClassId, chapterId),
      });
      queryClient.invalidateQueries({
        queryKey: questionBankKeys.chapterCount(selectedClassId, chapterId),
      });
      return;
    }
    if (partId) {
      await queryClient.invalidateQueries({
        queryKey: questionBankKeys.partQuestions(partId, bankScope),
      });
    }
  };

  return {
    collectionsList,
    getCollectionName,
    selectedIsParent,
    filterByCollection,
    classes,
    partConfigs,
    chapters,
    chaptersLoading,
    chapterConfigs,
    togglePartExpanded,
    toggleChapterExpanded,
    invalidateAfterEdit,
    invalidateAfterDelete,
    loadError,
  };
}
