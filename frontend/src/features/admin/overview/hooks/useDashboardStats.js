import {useQuery} from '@tanstack/react-query';

import {
  getContentInsights,
  getDashboardStats,
  getMonthlyPerformance,
  getTrafficHeatmap,
} from '~/shared/api/dashboardApi';

export const dashboardKeys = {
  stats: ['admin-dashboard-stats'],
  monthlyPerformance: (year) => ['admin-dashboard-monthly-performance', year ?? 'current'],
  trafficHeatmap: (endDate) => ['admin-dashboard-traffic-heatmap', endDate ?? 'today'],
  contentInsights: ['admin-dashboard-content-insights'],
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: getDashboardStats,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useMonthlyPerformance(year) {
  return useQuery({
    queryKey: dashboardKeys.monthlyPerformance(year),
    queryFn: () => getMonthlyPerformance(year),
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });
}

export function useContentInsights() {
  return useQuery({
    queryKey: dashboardKeys.contentInsights,
    queryFn: getContentInsights,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrafficHeatmap(endDate) {
  return useQuery({
    queryKey: dashboardKeys.trafficHeatmap(endDate),
    queryFn: () => getTrafficHeatmap(endDate),
    staleTime: 30 * 1000,
    keepPreviousData: true,
  });
}
