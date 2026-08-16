'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClassById, getClassChapterTests } from '@/app/apis/classApi';
import { deleteTest } from '@/app/apis/testApi';
import type { TestResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const testByClassKeys = {
  classInfo: (classId: string) => ['class-info', classId],
  chapterTests: (classId: string, chapterId: string) => ['class-chapter-tests', classId, chapterId],
};

const normalizeTests = (data: TestResponse[]): TestResponse[] =>
  Array.isArray(data) ? data : Array.isArray((data as any)?.data) ? (data as any).data : [];

export function useTestByClass(classId: string, chapterId: string) {
  const qc = useQueryClient();

  const classQuery = useQuery({
    queryKey: testByClassKeys.classInfo(classId),
    queryFn: () => getClassById(classId),
    enabled: !!classId,
    select: (data) => data?.className ?? '',
  });

  const testsQuery = useQuery({
    queryKey: testByClassKeys.chapterTests(classId, chapterId),
    queryFn: () => getClassChapterTests(classId, chapterId),
    enabled: !!classId && !!chapterId,
    select: normalizeTests,
  });

  const deleteTestMutation = useMutation<void, any, string>({
    mutationFn: (testId) => deleteTest(testId),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: testByClassKeys.chapterTests(classId, chapterId),
      }),
  });

  const refetchTests = () =>
    qc.invalidateQueries({
      queryKey: testByClassKeys.chapterTests(classId, chapterId),
    });

  return {
    className: classQuery.data ?? '',
    tests: testsQuery.data ?? EMPTY_LIST,
    isLoading: testsQuery.isLoading,
    refetchTests,
    deleteTestMutation,
  };
}
