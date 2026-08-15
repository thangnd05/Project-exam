import axios from './axiosClient';
import type {
  ContentInsightsResponse,
  DashboardStatsResponse,
  DayHours,
  MonthlyPerformanceResponse,
  TrafficLocationsResponse,
} from '@/app/types';

const BASE_DASHBOARD_URL = '/api/admin/dashboard';

export const getDashboardStats = (): Promise<DashboardStatsResponse> =>
  axios.get(`${BASE_DASHBOARD_URL}/stats`).then((response) => response.data);

export const getMonthlyPerformance = (year?: number): Promise<MonthlyPerformanceResponse> =>
  axios
    .get(`${BASE_DASHBOARD_URL}/monthly-performance`, {params: year ? {year} : {}})
    .then((response) => response.data);

export const getContentInsights = (): Promise<ContentInsightsResponse> =>
  axios.get(`${BASE_DASHBOARD_URL}/content-insights`).then((response) => response.data);

export const getTrafficLocations = (month?: string): Promise<TrafficLocationsResponse> =>
  axios
    .get(`${BASE_DASHBOARD_URL}/traffic-locations`, {params: month ? {month} : {}})
    .then((response) => response.data);

export const getTrafficHeatmap = (endDate?: string): Promise<DayHours[]> =>
  axios
    .get(`${BASE_DASHBOARD_URL}/traffic-heatmap`, {params: endDate ? {endDate} : {}})
    .then((response) => response.data);
