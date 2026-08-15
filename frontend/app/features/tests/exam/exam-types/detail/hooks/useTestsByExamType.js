'use client';

import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@/app/configs/queryClient';
import {
  getTestsByExamType,
  getTestCollectionsByExamType,
  getCertificateExamsByExamType,
} from '@/app/apis/testApi';
import { getExamTypeById, getExamTypeChildren } from '@/app/apis/examTypeApi';

const PAGE_SIZE = 12;

export const examTypeTestsKeys = {
  tests: (id, page) => ['examtype-tests', id, page],
  name: (id) => ['examtype-name', id],
  folders: (id) => ['examtype-folders', id],
  children: (id) => ['examtype-children', id],
  certificateExams: (id) => ['examtype-certificate-exams', id],
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

  const certificateExamsQuery = useQuery({
    queryKey: examTypeTestsKeys.certificateExams(examTypeId),
    queryFn: () => getCertificateExamsByExamType(examTypeId),
    enabled: !!examTypeId,
  });

  return {
    tests: Array.isArray(testsQuery.data?.content) ? testsQuery.data.content : [],
    certificateExam: certificateExamsQuery.data ?? null,
    totalPages: testsQuery.data?.totalPages ?? 0,
    examTypeName: nameQuery.data ?? '',
    folders: foldersQuery.data ?? [],
    children: childrenQuery.data ?? [],
    isLoading: testsQuery.isLoading,
  };
}
