import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '~/shared/config/queryClient';
import { getMockHistory } from '~/shared/api/userTestApi';
import { getExamTypes } from '~/shared/api/examTypeApi';
import { getUserTarget } from '~/shared/api/userTargetApi';

// Biểu đồ chỉ cần N bài gần nhất để vẽ tiến triển; bảng phân trang riêng.
export const CHART_FETCH_LIMIT = 25;

export const mockHistoryKeys = {
  examTypes: ['exam-types'],
  chart: (examTypeId) => ['mock-history-chart', examTypeId || ''],
  table: (examTypeId, page, size) => ['mock-history-table', examTypeId || '', page, size],
  userTarget: (examTypeId) => ['user-target', examTypeId],
};

const selectTargetScore = (data) => (data?.hasTarget ? data.targetScore : null);

export function useMockHistory(examTypeFilter, { page = 0, size = 10 } = {}) {
  const examTypesQuery = useQuery({
    queryKey: mockHistoryKeys.examTypes,
    queryFn: getExamTypes,
  });

  // Dữ liệu cho biểu đồ: luôn lấy trang đầu (bài mới nhất), size = CHART_FETCH_LIMIT.
  const chartQuery = useQuery({
    queryKey: mockHistoryKeys.chart(examTypeFilter),
    queryFn: () =>
      getMockHistory({ page: 0, size: CHART_FETCH_LIMIT, examTypeId: examTypeFilter || undefined }),
  });

  // Dữ liệu cho bảng: phân trang theo page/size người dùng chọn.
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
