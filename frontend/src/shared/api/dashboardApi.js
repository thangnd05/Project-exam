import axios from './axiosClient';

const BASE_DASHBOARD_URL = '/api/admin/dashboard';

export const getDashboardStats = () =>
  axios.get(`${BASE_DASHBOARD_URL}/stats`).then((response) => response.data);

export const getMonthlyPerformance = (year) =>
  axios
    .get(`${BASE_DASHBOARD_URL}/monthly-performance`, {params: year ? {year} : {}})
    .then((response) => response.data);

export const getContentInsights = () =>
  axios.get(`${BASE_DASHBOARD_URL}/content-insights`).then((response) => response.data);

export const getTrafficHeatmap = (endDate) =>
  axios
    .get(`${BASE_DASHBOARD_URL}/traffic-heatmap`, {params: endDate ? {endDate} : {}})
    .then((response) => response.data);
