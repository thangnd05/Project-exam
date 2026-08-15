'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '@/app/utils/collectionTree';

export const BANK_SCOPE = {
  ADMIN: 'admin',
  PERSONAL: 'personal',
  CLASS: 'class',
};

export const questionBankKeys = {
  collections: ['question-bank', 'collections'],
  myClasses: ['question-bank', 'my-classes'],
  chapters: (classId) => ['question-bank', 'chapters', classId],
  chapterCount: (classId, chapterId) => ['question-bank', 'chapter-count', classId, chapterId],
  chapterQuestions: (classId, chapterId) => ['question-bank', 'chapter-questions', classId, chapterId],
  partQuestions: (partId, scope) => ['question-bank', 'part-questions', partId, scope],
};

const normalizeCollections = (data) =>
  Array.isArray(data) ? data : (data?.data || data?.content || []);

const normalizeMyClasses = (result) =>
  Array.isArray(result) ? result : result?.classes || [];

const normalizeChapters = (raw) =>
  Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);

const normalizePartQuestions = (data) =>
  Array.isArray(data) ? data : (data?.data ?? data?.questions ?? []);

const normalizeChapterQuestions = (raw) =>
  Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);

/**
 * Data layer for PersonalQuestionBankPage  page keeps only UI/modal state.
 */
export function usePersonalQuestionBank({
  bankScope,
  examTypeId,
  selectedClassId,
  examParts,
  collectionFilter,
  includeChildCollections,
}) {
  const queryClient = useQueryClient();
  const [expandedParts, setExpandedParts] = useState(() => new Set());
  const [expandedChapters, setExpandedChapters] = useState(() => new Set());
  const [loadError, setLoadError] = useState(null);

  const isPartScope =
    bankScope === BANK_SCOPE.PERSONAL || bankScope === BANK_SCOPE.ADMIN;

  const collectionsQuery = useQuery({
    queryKey: questionBankKeys.collections,
    queryFn: getQuestionCollections,
    select: normalizeCollections,
  });
  const collectionsList = collectionsQuery.data ?? [];

  const collectionsMap = useMemo(() => {
    const map = {};
    collectionsList.forEach((c) => {
      if (c?.collectionId) map[c.collectionId] = c.name || '(Không tên)';
    });
    return map;
  }, [collectionsList]);

  const getCollectionName = (id) => {
    if (!id) return '';
    return collectionsMap[id] || '(Không xác định)';
  };

  const selectedIsParent = isParentCollection(collectionsList, collectionFilter);

  const filterByCollection = (questions) => {
    if (!collectionFilter) return questions;
    if (collectionFilter === '__none__') {
      return questions.filter((q) => !q.collectionId);
    }
    if (includeChildCollections && selectedIsParent) {
      const ids = new Set(getCollectionWithDescendantIds(collectionsList, collectionFilter));
      return questions.filter((q) => ids.has(q.collectionId));
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
    const map = {};
    (examParts || []).forEach((p, i) => {
      const q = partQueries[i];
      map[p.examPartId] = {
        expanded: expandedParts.has(p.examPartId),
        loading: q?.isLoading ?? false,
        questions: q?.data ?? [],
      };
    });
    return map;
  }, [examParts, partQueries, expandedParts]);

  const anyPartError = partQueries.some((q) => q.isError);
  useEffect(() => {
    if (anyPartError) {
      setLoadError('Không tải được danh sách câu hỏi.');
    }
  }, [anyPartError]);

  useEffect(() => {
    setExpandedParts(new Set());
  }, [examTypeId, bankScope]);

  const togglePartExpanded = (partId) => {
    setExpandedParts((prev) => {
      const next = new Set(prev);
      if (next.has(partId)) next.delete(partId);
      else next.add(partId);
      return next;
    });
  };

  const chaptersQuery = useQuery({
    queryKey: questionBankKeys.chapters(selectedClassId),
    queryFn: () => getChaptersByClass(selectedClassId),
    enabled: bankScope === BANK_SCOPE.CLASS && !!selectedClassId,
    select: normalizeChapters,
  });
  const chapters = chaptersQuery.data ?? [];
  const chaptersLoading = chaptersQuery.isLoading;

  useEffect(() => {
    if (chaptersQuery.isError) {
      setLoadError('Không tải được danh sách chương.');
    }
  }, [chaptersQuery.isError]);

  const chapterCountQueries = useQueries({
    queries: chapters.map((ch) => ({
      queryKey: questionBankKeys.chapterCount(selectedClassId, ch.chapterId),
      queryFn: () =>
        getMyClassBankCount({ classId: selectedClassId, chapterId: ch.chapterId }),
      enabled: bankScope === BANK_SCOPE.CLASS && !!selectedClassId,
      select: (count) => (typeof count === 'number' ? count : 0),
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
    const map = {};
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
  useEffect(() => {
    if (anyChapterQuestionError) {
      setLoadError('Không tải được câu hỏi của chương này.');
    }
  }, [anyChapterQuestionError]);

  useEffect(() => {
    setExpandedChapters(new Set());
  }, [selectedClassId, bankScope]);

  const toggleChapterExpanded = (chapterId) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const invalidateAfterEdit = async ({ editingPartId, editingChapterId } = {}) => {
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

  const invalidateAfterDelete = async ({ partId = null, chapterId = null } = {}) => {
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

  const clearLoadError = useCallback(() => setLoadError(null), []);

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
    clearLoadError,
  };
}
