import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '~/config/queryClient';
import { getTestsByExamType, getTestCollectionsByExamType } from '~/api/testApi';
import { getExamTypeById, getExamTypeChildren } from '~/api/examTypeApi';

const PAGE_SIZE = 12;

export const examTypeTestsKeys = {
  tests: (id, page) => ['examtype-tests', id, page],
  name: (id) => ['examtype-name', id],
  folders: (id) => ['examtype-folders', id],
  children: (id) => ['examtype-children', id],
};

const normalizeArray = (data) => (Array.isArray(data) ? data : []);

export function useTestsByExamType(examTypeId, page = 0) {
  const testsQuery = useQuery({
    queryKey: examTypeTestsKeys.tests(examTypeId, page),
    queryFn: () => getTestsByExamType(examTypeId, { page, size: PAGE_SIZE }),
    enabled: !!examTypeId,
    placeholderData: keepPreviousData,
  });

  const nameQuery = useQuery({
    queryKey: examTypeTestsKeys.name(examTypeId),
    queryFn: () => getExamTypeById(examTypeId),
    enabled: !!examTypeId,
    select: (data) => data?.name ?? '',
  });

  const foldersQuery = useQuery({
    queryKey: examTypeTestsKeys.folders(examTypeId),
    queryFn: () => getTestCollectionsByExamType(examTypeId),
    enabled: !!examTypeId,
    select: normalizeArray,
  });

  const childrenQuery = useQuery({
    queryKey: examTypeTestsKeys.children(examTypeId),
    queryFn: () => getExamTypeChildren(examTypeId),
    enabled: !!examTypeId,
    select: normalizeArray,
  });

  return {
    tests: Array.isArray(testsQuery.data?.content) ? testsQuery.data.content : [],
    totalPages: testsQuery.data?.totalPages ?? 0,
    examTypeName: nameQuery.data ?? '',
    folders: foldersQuery.data ?? [],
    children: childrenQuery.data ?? [],
    isLoading: testsQuery.isLoading,
  };
}
