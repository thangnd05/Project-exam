'use client';
import {useQuery} from '@tanstack/react-query';

import {getStandardExamTypes} from '@/app/apis/examTypeApi';
import {examTypeKeys} from '@/app/hooks/examTypeKeys';
import type {ExamTypeResponse} from '@/app/types/exam-type';
import {EMPTY_LIST} from '@/app/utils/stableEmpty';

const normalizeExamTypes = (payload: unknown): ExamTypeResponse[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && Array.isArray((payload as {data?: unknown}).data)) {
    return (payload as {data: ExamTypeResponse[]}).data;
  }
  return [];
};

const isAwsExam = (exam: ExamTypeResponse) =>
  /aws/i.test(`${exam.name ?? ''} ${exam.parentName ?? ''}`);

const isLeafExam = (exam: ExamTypeResponse) => Number(exam.childCount ?? 0) === 0;

export const hallOfFameTabLabel = (name?: string) => {
  const code = name?.match(/\(([A-Z0-9-]+)\)/i)?.[1];
  if (code) return code.toUpperCase();
  return (name ?? 'Kỳ thi').replace(/^AWS Certified\s+/i, '');
};

export function useHallOfFameExams() {
  const query = useQuery({
    queryKey: examTypeKeys.standard,
    queryFn: getStandardExamTypes,
    select: (payload) =>
      normalizeExamTypes(payload)
        .filter((exam) => !exam.flexible && isAwsExam(exam) && isLeafExam(exam))
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'en')),
  });

  return {
    exams: query.data ?? EMPTY_LIST,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
