'use client';

import { useQuery } from '@tanstack/react-query';

import {
  getContentInsights,
  getDashboardStats,
  getMonthlyPerformance,
  getTrafficHeatmap,
  getTrafficLocations,
} from '@/app/apis/dashboardApi';
import type {
  DashboardStats,
  DashboardTraffic,
  DayHours,
  MonthlyPerformanceResponse,
  NameValue,
  TrafficLocationsResponse,
} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const dashboardKeys = {
  stats: ['admin-dashboard-stats'],
  monthlyPerformance: (year?: number) => ['admin-dashboard-monthly-performance', year ?? 'current'],
  trafficHeatmap: (endDate?: string) => ['admin-dashboard-traffic-heatmap', endDate ?? 'today'],
  trafficLocations: (month?: string) => ['admin-dashboard-traffic-locations', month ?? 'current'],
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

  const stats: Partial<DashboardStats> = query.data?.stats ?? {};
  const traffic: DashboardTraffic = query.data?.traffic ?? {
    visitsToday: 0,
    heatmap: [],
    topCountries: [],
  };
  const statusDistribution: NameValue[] = query.data?.statusDistribution ?? [];

  return {
    stats,
    traffic,
    statusDistribution,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useMonthlyPerformance(year?: number) {
  const query = useQuery<MonthlyPerformanceResponse>({
    queryKey: dashboardKeys.monthlyPerformance(year),
    queryFn: () => getMonthlyPerformance(year),
    staleTime: 60 * 1000,
    ...({keepPreviousData: true} as any),
  });

  return {
    months: query.data?.months ?? EMPTY_LIST,
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
    topTests: query.data?.topTests ?? EMPTY_LIST,
    topPracticeTests: query.data?.topPracticeTests ?? EMPTY_LIST,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useTrafficLocations(month?: string) {
  const query = useQuery<TrafficLocationsResponse>({
    queryKey: dashboardKeys.trafficLocations(month),
    queryFn: () => getTrafficLocations(month),
    staleTime: 60 * 1000,
    ...({keepPreviousData: true} as any),
  });

  return {
    month: query.data?.month ?? month,
    totalVisits: query.data?.totalVisits ?? 0,
    availableMonths: query.data?.availableMonths ?? EMPTY_LIST,
    topCountries: query.data?.topCountries ?? EMPTY_LIST,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useTrafficHeatmap(endDate?: string) {
  const query = useQuery<DayHours[]>({
    queryKey: dashboardKeys.trafficHeatmap(endDate),
    queryFn: () => getTrafficHeatmap(endDate),
    staleTime: 30 * 1000,
    ...({keepPreviousData: true} as any),
  });

  return {
    heatmap: query.data ?? EMPTY_LIST,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
