'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getChaptersByClass,
  createChapter,
  updateChapter,
  deleteChapter,
} from '~/shared/api/chapterApi';
import { getClassById } from '~/shared/api/classApi';

export const chapterKeys = {
  list: (classId) => ['chapters', classId],
  classInfo: (classId) => ['class-info', classId],
};

const normalizeChapters = (data) =>
  Array.isArray(data) ? data : data?.content ?? [];

export function useChaptersOfClass(classId) {
  const qc = useQueryClient();

  const chaptersQuery = useQuery({
    queryKey: chapterKeys.list(classId),
    queryFn: () => getChaptersByClass(classId),
    enabled: !!classId,
    select: normalizeChapters,
  });

  const classInfoQuery = useQuery({
    queryKey: chapterKeys.classInfo(classId),
    queryFn: () => getClassById(classId),
    enabled: !!classId,
  });

  const deleteChapterMutation = useMutation({
    mutationFn: (chapterId) => deleteChapter(chapterId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: chapterKeys.list(classId) }),
  });

  const refetchChapters = () =>
    qc.invalidateQueries({ queryKey: chapterKeys.list(classId) });

  return {
    chapters: chaptersQuery.data ?? [],
    className: classInfoQuery.data?.className ?? '',
    classQr: classInfoQuery.data?.classQr ?? '',
    isLoading: chaptersQuery.isLoading,
    isError: chaptersQuery.isError,
    deleteChapterMutation,
    refetchChapters,
  };
}

export function useCreateChapter(classId, { onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createChapter(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: chapterKeys.list(classId) });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}

export function useUpdateChapter(classId, { onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chapterId, payload }) => updateChapter(chapterId, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: chapterKeys.list(classId) });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}
