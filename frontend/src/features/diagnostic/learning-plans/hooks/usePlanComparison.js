import { useQuery } from '@tanstack/react-query';
import { getStandardExamTypes } from '~/shared/api/examTypeApi';
import { listPlans } from '~/shared/api/learningPlanApi';

export const planComparisonKeys = {
  examTypes: () => ['exam-types', 'standard'],
  plans: (examTypeId) => ['learning-plans', examTypeId],
};

const normalizeList = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];

export function usePlanComparison(examTypeId) {
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
    examTypes: examTypesQuery.data ?? [],
    plans: plansQuery.data ?? [],
    loading: plansQuery.isLoading,
    error: plansQuery.error
      ? plansQuery.error?.response?.data?.message || plansQuery.error.message
      : null,
  };
}
