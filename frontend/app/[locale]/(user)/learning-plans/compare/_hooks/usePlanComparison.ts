'use client';

import { useQuery } from '@tanstack/react-query';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import { listPlans } from '@/app/apis/learningPlanApi';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import { getApiErrorMessage } from '@/app/utils/apiError';
import {examTypeKeys} from '@/app/configs/queryKeys';

export const planComparisonKeys = {
  examTypes: () => examTypeKeys.standard,
  plans: (examTypeId?: string) => ['learning-plans', examTypeId],
};

// API có thể trả mảng trực tiếp hoặc bọc trong { content } (phân trang).
const normalizeList = <T,>(data: T[] | { content?: T[] } | null | undefined): T[] => {
  if (Array.isArray(data)) return data;
  const content = data?.content;
  return Array.isArray(content) ? content : [];
};

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
      ? getApiErrorMessage(plansQuery.error, '') || plansQuery.error.message
      : null,
  };
}
