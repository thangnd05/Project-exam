import { useQuery } from '@tanstack/react-query';

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
  const query = useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: getDashboardStats,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  return {
    stats: query.data?.stats ?? {},
    traffic: query.data?.traffic ?? {
      visitsToday: 0,
      heatmap: [],
      topCountries: [],
    },
    statusDistribution: query.data?.statusDistribution ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useMonthlyPerformance(year) {
  const query = useQuery({
    queryKey: dashboardKeys.monthlyPerformance(year),
    queryFn: () => getMonthlyPerformance(year),
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });

  return {
    months: query.data?.months ?? [],
    availableYears: query.data?.availableYears ?? [new Date().getFullYear()],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useContentInsights() {
  const query = useQuery({
    queryKey: dashboardKeys.contentInsights,
    queryFn: getContentInsights,
    staleTime: 5 * 60 * 1000,
  });

  return {
    topTests: query.data?.topTests ?? [],
    topPracticeTests: query.data?.topPracticeTests ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useTrafficHeatmap(endDate) {
  const query = useQuery({
    queryKey: dashboardKeys.trafficHeatmap(endDate),
    queryFn: () => getTrafficHeatmap(endDate),
    staleTime: 30 * 1000,
    keepPreviousData: true,
  });

  return {
    heatmap: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
