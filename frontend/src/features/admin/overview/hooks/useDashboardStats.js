import {useQuery} from '@tanstack/react-query';

import {
  getContentInsights,
  getDashboardStats,
  getMonthlyPerformance,
  getTrafficHeatmap,
} from '~/features/admin/api/dashboardApi';

export const dashboardKeys = {
  stats: ['admin-dashboard-stats'],
  monthlyPerformance: (year) => ['admin-dashboard-monthly-performance', year ?? 'current'],
  trafficHeatmap: (endDate) => ['admin-dashboard-traffic-heatmap', endDate ?? 'today'],
  contentInsights: ['admin-dashboard-content-insights'],
};

/** Số liệu tổng quan cho Dashboard admin — tự làm mới mỗi 30s và khi quay lại tab. */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: getDashboardStats,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

/** Hiệu suất đủ 12 tháng của năm được chọn (year = undefined → năm hiện tại). */
export function useMonthlyPerformance(year) {
  return useQuery({
    queryKey: dashboardKeys.monthlyPerformance(year),
    queryFn: () => getMonthlyPerformance(year),
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });
}

/** Phân tích nội dung (bài hot & câu khó) — số liệu nặng, ít đổi, chỉ trang Thống kê dùng. */
export function useContentInsights() {
  return useQuery({
    queryKey: dashboardKeys.contentInsights,
    queryFn: getContentInsights,
    staleTime: 5 * 60 * 1000,
  });
}

/** Heatmap ngày×giờ cho 7 ngày kết thúc ở endDate ('yyyy-MM-dd'; undefined → hôm nay). */
export function useTrafficHeatmap(endDate) {
  return useQuery({
    queryKey: dashboardKeys.trafficHeatmap(endDate),
    queryFn: () => getTrafficHeatmap(endDate),
    staleTime: 30 * 1000,
    keepPreviousData: true,
  });
}
