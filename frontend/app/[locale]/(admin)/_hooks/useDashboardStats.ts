'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  getDashboardStats,
  getMonthlyPerformance,
  getTestUsage,
  getTrafficHeatmap,
  getTrafficLocations,
} from '@/app/apis/dashboardApi';
import type {
  DashboardStats,
  DashboardTraffic,
  DayHours,
  MonthlyPerformanceResponse,
  TrafficLocationsResponse,
} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const dashboardKeys = {
  stats: ['admin-dashboard-stats'],
  monthlyPerformance: (year?: number) => ['admin-dashboard-monthly-performance', year ?? 'current'],
  trafficHeatmap: (endDate?: string) => ['admin-dashboard-traffic-heatmap', endDate ?? 'today'],
  trafficLocations: (month?: string) => ['admin-dashboard-traffic-locations', month ?? 'current'],
  testUsage: (page: number, size: number) => ['admin-dashboard-test-usage', page, size],
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

  return {
    stats,
    traffic,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useMonthlyPerformance(year?: number) {
  const query = useQuery<MonthlyPerformanceResponse>({
    queryKey: dashboardKeys.monthlyPerformance(year),
    queryFn: () => getMonthlyPerformance(year),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });

  return {
    months: query.data?.months ?? EMPTY_LIST,
    availableYears: query.data?.availableYears ?? [new Date().getFullYear()],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useTestUsage(page: number, size: number) {
  const query = useQuery({
    queryKey: dashboardKeys.testUsage(page, size),
    queryFn: () => getTestUsage(page, size),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  return {
    tests: query.data?.content ?? EMPTY_LIST,
    totalPages: query.data?.totalPages ?? 0,
    totalElements: query.data?.totalElements ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useTrafficLocations(month?: string) {
  const query = useQuery<TrafficLocationsResponse>({
    queryKey: dashboardKeys.trafficLocations(month),
    queryFn: () => getTrafficLocations(month),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
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
    placeholderData: keepPreviousData,
  });

  return {
    heatmap: query.data ?? EMPTY_LIST,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
