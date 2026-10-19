'use client';

import {useQuery} from '@tanstack/react-query';

import {getExamTypeById} from '@/app/apis/examTypeApi';
import {examTypeKeys} from '@/app/features/exam-types/examTypeKeys';
import type {ExamTypeResponse} from '@/app/types';

export {examTypeKeys};

export function durationMinutesFromExamType(
  examTypes: Pick<ExamTypeResponse, 'examTypeId' | 'durationMinutes'>[],
  examTypeId: string,
): string {
  if (!examTypeId) return '';
  const selected = examTypes.find((item) => String(item.examTypeId) === String(examTypeId));
  const minutes = selected?.durationMinutes;
  return minutes != null && Number(minutes) > 0 ? String(minutes) : '';
}

export function useExamTypeById(examTypeId?: string) {
  const query = useQuery({
    queryKey: examTypeKeys.detail(examTypeId),
    queryFn: () => getExamTypeById(examTypeId as string),
    enabled: !!examTypeId,
  });

  return {
    examType: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
