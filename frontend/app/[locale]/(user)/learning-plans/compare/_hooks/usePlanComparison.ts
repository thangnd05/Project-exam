'use client';

import { useQuery } from '@tanstack/react-query';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import { listPlans } from '@/app/apis/learningPlanApi';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import { getApiErrorMessage } from '@/app/utils/apiError';
import {examTypeKeys} from '@/app/configs/queryKeys';
import { toList } from '@/app/utils/toList';

export const planComparisonKeys = {
  examTypes: () => examTypeKeys.standard,
  plans: (examTypeId?: string) => ['learning-plans', examTypeId],
};

export function usePlanComparison(examTypeId?: string) {
  const examTypesQuery = useQuery({
    queryKey: planComparisonKeys.examTypes(),
    queryFn: getStandardExamTypes,
    select: toList,
  });

  const plansQuery = useQuery({
    queryKey: planComparisonKeys.plans(examTypeId),
    queryFn: () => listPlans(examTypeId),
    enabled: !!examTypeId,
    select: toList,
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
