import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClassById, getClassChapterTests } from '~/shared/api/classApi';
import { deleteTest } from '~/shared/api/testApi';

export const testByClassKeys = {
  classInfo: (classId) => ['class-info', classId],
  chapterTests: (classId, chapterId) => ['class-chapter-tests', classId, chapterId],
};

const normalizeTests = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

export function useTestByClass(classId, chapterId) {
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

  const deleteTestMutation = useMutation({
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
    tests: testsQuery.data ?? [],
    isLoading: testsQuery.isLoading,
    refetchTests,
    deleteTestMutation,
  };
}
