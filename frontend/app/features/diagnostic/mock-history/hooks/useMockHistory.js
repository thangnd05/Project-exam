'use client';

import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@/app/configs/queryClient';
import { getMockHistory } from '@/app/apis/userTestApi';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import { getUserTarget } from '@/app/apis/userTargetApi';

export const CHART_FETCH_LIMIT = 25;

export const mockHistoryKeys = {
  examTypes: ['exam-types', 'standard'],
  chart: (examTypeId) => ['mock-history-chart', examTypeId || ''],
  table: (examTypeId, page, size) => ['mock-history-table', examTypeId || '', page, size],
  userTarget: (examTypeId) => ['user-target', examTypeId],
};

const selectTargetScore = (data) => (data?.hasTarget ? data.targetScore : null);

export function useMockHistory(examTypeFilter, { page = 0, size = 10 } = {}) {
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
    error: err ? err?.response?.data?.message || err.message : null,
    targetScore: examTypeFilter ? targetQuery.data ?? null : null,
  };
}
