'use client';

import { useQuery } from '@tanstack/react-query';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import { listPlans } from '@/app/apis/learningPlanApi';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const planComparisonKeys = {
  examTypes: () => ['exam-types', 'standard'],
  plans: (examTypeId?: string) => ['learning-plans', examTypeId],
};

const normalizeList = <T>(data: T[]): T[] =>
  Array.isArray(data) ? data : Array.isArray((data as any)?.content) ? (data as any).content : [];

export function usePlanComparison(examTypeId?: string) {
  const examTypesQuery = useQuery({
    queryKey: planComparisonKeys.examTypes(),
    queryFn: getStandardExamTypes,
    select: normalizeList,
  });

  const plansQuery = useQuery({
    queryKey: planComparisonKeys.plans(examTypeId),
    queryFn: () => listPlans(examTypeId),
    enabled: !!examTypeId,
    select: normalizeList,
  });

  return {
    examTypes: examTypesQuery.data ?? EMPTY_LIST,
    plans: plansQuery.data ?? EMPTY_LIST,
    isLoading: plansQuery.isLoading,
    isError: plansQuery.isError,
    error: plansQuery.error
      ? (plansQuery.error as any)?.response?.data?.message || plansQuery.error.message
      : null,
  };
}
