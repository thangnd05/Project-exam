'use client';

import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@/app/configs/queryClient';
import {
  getTestsByExamType,
  getCertificateExamsByExamType,
} from '@/app/apis/testApi';
import { getExamTypeById, getExamTypeChildren } from '@/app/apis/examTypeApi';
import type {
  CertificateExamListResponse,
  ExamTypeResponse,
  TestResponse,
} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import {examTypeKeys} from '@/app/configs/queryKeys';

const PAGE_SIZE = 12;

export const examTypeTestsKeys = {
  tests: (id?: string, page?: number) => ['examtype-tests', id, page],
  name: examTypeKeys.detail,
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

  const examTypeQuery = useQuery({
    queryKey: examTypeTestsKeys.name(examTypeId),
    queryFn: () => getExamTypeById(examTypeId as string),
    enabled: !!examTypeId,
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
    totalElements: testsQuery.data?.totalElements ?? 0,
    examType: (examTypeQuery.data ?? null) as ExamTypeResponse | null,
    examTypeName: examTypeQuery.data?.name ?? '',
    children: childrenQuery.data ?? EMPTY_LIST,
    isLoading: testsQuery.isLoading,
  };
}
