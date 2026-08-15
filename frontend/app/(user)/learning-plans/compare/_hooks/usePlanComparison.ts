'use client';

import { useQuery } from '@tanstack/react-query';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import { listPlans } from '@/app/apis/learningPlanApi';

export const planComparisonKeys = {
  examTypes: () => ['exam-types', 'standard'],
  plans: (examTypeId?: string) => ['learning-plans', examTypeId],
};

// Giữ nhánh { content } phòng hờ dạng phân trang như bản JS cũ (data as any vì nhánh này
// không nằm trong kiểu trả về đã khai báo của API)
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
    examTypes: examTypesQuery.data ?? [],
    plans: plansQuery.data ?? [],
    isLoading: plansQuery.isLoading,
    isError: plansQuery.isError,
    error: plansQuery.error
      ? // err any có chủ đích: lỗi Axios, đọc response.data.message (BE không có type lỗi)
        (plansQuery.error as any)?.response?.data?.message || plansQuery.error.message
      : null,
  };
}
