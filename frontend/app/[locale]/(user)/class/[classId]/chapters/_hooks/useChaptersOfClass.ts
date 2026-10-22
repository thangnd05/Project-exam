'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import {
  getChaptersByClass,
  createChapter,
  updateChapter,
  deleteChapter,
} from '@/app/apis/chapterApi';
import { getClassById } from '@/app/apis/classApi';
import type { ChapterRequest, ChapterResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import {classChapterKeys, classKeys} from '@/app/configs/queryKeys';

export const chapterKeys = {
  list: classChapterKeys.byClass,
  classInfo: classKeys.detail,
};

// API có thể trả mảng trực tiếp hoặc bọc trong { content } (phân trang).
const normalizeChapters = (data: unknown): ChapterResponse[] => {
  if (Array.isArray(data)) return data;
  const content = (data as { content?: unknown } | null | undefined)?.content;
  return Array.isArray(content) ? content : [];
};

export function useChaptersOfClass(classId: string) {
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

  const deleteChapterMutation = useMutation<void, Error, string>({
    mutationFn: (chapterId) => deleteChapter(chapterId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: chapterKeys.list(classId) }),
  });

  const refetchChapters = () =>
    qc.invalidateQueries({ queryKey: chapterKeys.list(classId) });

  return {
    chapters: chaptersQuery.data ?? EMPTY_LIST,
    className: classInfoQuery.data?.className ?? '',
    classQr: classInfoQuery.data?.classQr ?? '',
    isLoading: chaptersQuery.isLoading,
    isError: chaptersQuery.isError,
    deleteChapterMutation,
    refetchChapters,
  };
}

type MutationCallbacks<TData, TVariables> = Pick<
  UseMutationOptions<TData, Error, TVariables>,
  'onSuccess' | 'onError'
>;

export function useCreateChapter(
  classId: string,
  { onSuccess, onError }: MutationCallbacks<ChapterResponse, ChapterRequest> = {},
) {
  const qc = useQueryClient();
  return useMutation<ChapterResponse, Error, ChapterRequest>({
    mutationFn: (payload) => createChapter(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: chapterKeys.list(classId) });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}

export function useUpdateChapter(
  classId: string,
  {
    onSuccess,
    onError,
  }: MutationCallbacks<ChapterResponse, { chapterId: string; payload: ChapterRequest }> = {},
) {
  const qc = useQueryClient();
  return useMutation<ChapterResponse, Error, { chapterId: string; payload: ChapterRequest }>({
    mutationFn: ({ chapterId, payload }) => updateChapter(chapterId, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: chapterKeys.list(classId) });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}
