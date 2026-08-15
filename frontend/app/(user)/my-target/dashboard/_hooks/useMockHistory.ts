'use client';

import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@/app/configs/queryClient';
import { getMockHistory } from '@/app/apis/userTestApi';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import { getUserTarget } from '@/app/apis/userTargetApi';
import type { UserTargetResponse } from '@/app/types';

export const CHART_FETCH_LIMIT = 25;

export const mockHistoryKeys = {
  examTypes: ['exam-types', 'standard'],
  chart: (examTypeId?: string) => ['mock-history-chart', examTypeId || ''],
  table: (examTypeId: string | undefined, page: number, size: number) =>
    ['mock-history-table', examTypeId || '', page, size],
  userTarget: (examTypeId?: string) => ['user-target', examTypeId],
};

const selectTargetScore = (data: UserTargetResponse) =>
  (data?.hasTarget ? data.targetScore : null);

export function useMockHistory(
  examTypeFilter: string,
  { page = 0, size = 10 }: { page?: number; size?: number } = {},
) {
  const examTypesQuery = useQuery({
    queryKey: mockHistoryKeys.examTypes,
    queryFn: getStandardExamTypes,
  });

  const chartQuery = useQuery({
    queryKey: mockHistoryKeys.chart(examTypeFilter),
    queryFn: () =>
      getMockHistory({ page: 0, size: CHART_FETCH_LIMIT, examTypeId: examTypeFilter || undefined }),
  });

  const tableQuery = useQuery({
    queryKey: mockHistoryKeys.table(examTypeFilter, page, size),
    queryFn: () => getMockHistory({ page, size, examTypeId: examTypeFilter || undefined }),
    placeholderData: keepPreviousData,
  });

  const targetQuery = useQuery({
    queryKey: mockHistoryKeys.userTarget(examTypeFilter),
    queryFn: () => getUserTarget(examTypeFilter),
    enabled: !!examTypeFilter,
    select: selectTargetScore,
  });

  const err = tableQuery.error || chartQuery.error;

  return {
    examTypes: examTypesQuery.data ?? [],
    chartTests: chartQuery.data?.content ?? [],
    tablePage: tableQuery.data ?? null,
    isLoading: chartQuery.isLoading || tableQuery.isLoading,
    // Giữ nguyên cách lấy message của bản .js (axios error không có type sẵn).
    error: err ? (err as any)?.response?.data?.message || err.message : null,
    targetScore: examTypeFilter ? targetQuery.data ?? null : null,
  };
}
