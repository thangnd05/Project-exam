'use client';

import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@/app/configs/queryClient';
import {
  getTestsByExamType,
  getTestCollectionsByExamType,
  getCertificateExamsByExamType,
} from '@/app/apis/testApi';
import { getExamTypeById, getExamTypeChildren } from '@/app/apis/examTypeApi';
import type {
  CertificateExamListResponse,
  ExamTypeResponse,
  TestCollectionResponse,
  TestResponse,
} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

const PAGE_SIZE = 12;

export const examTypeTestsKeys = {
  tests: (id?: string, page?: number) => ['examtype-tests', id, page],
  name: (id?: string) => ['examtype-name', id],
  folders: (id?: string) => ['examtype-folders', id],
  children: (id?: string) => ['examtype-children', id],
  certificateExams: (id?: string) => ['examtype-certificate-exams', id],
};

const normalizeArray = <T,>(data: T[] | null | undefined): T[] =>
  Array.isArray(data) ? data : [];

export function useTestsByExamType(examTypeId?: string, page = 0) {
  const testsQuery = useQuery({
    queryKey: examTypeTestsKeys.tests(examTypeId, page),
    queryFn: () => getTestsByExamType(examTypeId as string, { page, size: PAGE_SIZE }),
    enabled: !!examTypeId,
    placeholderData: keepPreviousData,
  });

  const nameQuery = useQuery({
    queryKey: examTypeTestsKeys.name(examTypeId),
    queryFn: () => getExamTypeById(examTypeId as string),
    enabled: !!examTypeId,
    select: (data) => data?.name ?? '',
  });

  const foldersQuery = useQuery({
    queryKey: examTypeTestsKeys.folders(examTypeId),
    queryFn: () => getTestCollectionsByExamType(examTypeId as string),
    enabled: !!examTypeId,
    select: normalizeArray<TestCollectionResponse>,
  });

  const childrenQuery = useQuery({
    queryKey: examTypeTestsKeys.children(examTypeId),
    queryFn: () => getExamTypeChildren(examTypeId as string),
    enabled: !!examTypeId,
    select: normalizeArray<ExamTypeResponse>,
  });

  const certificateExamsQuery = useQuery({
    queryKey: examTypeTestsKeys.certificateExams(examTypeId),
    queryFn: () => getCertificateExamsByExamType(examTypeId as string),
    enabled: !!examTypeId,
  });

  return {
    tests: (Array.isArray(testsQuery.data?.content)
      ? testsQuery.data!.content
      : []) as TestResponse[],
    certificateExam: (certificateExamsQuery.data ?? null) as CertificateExamListResponse | null,
    totalPages: testsQuery.data?.totalPages ?? 0,
    examTypeName: nameQuery.data ?? '',
    folders: foldersQuery.data ?? EMPTY_LIST,
    children: childrenQuery.data ?? EMPTY_LIST,
    isLoading: testsQuery.isLoading,
  };
}
