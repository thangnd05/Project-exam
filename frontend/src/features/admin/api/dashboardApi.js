import axios from '~/shared/api/axiosClient';

const BASE_DASHBOARD_URL = '/api/admin/dashboard';

export const getDashboardStats = () =>
  axios.get(`${BASE_DASHBOARD_URL}/stats`).then((response) => response.data);

/** Hiệu suất đủ 12 tháng của một năm (bỏ trống = năm hiện tại). */
export const getMonthlyPerformance = (year) =>
  axios
    .get(`${BASE_DASHBOARD_URL}/monthly-performance`, {params: year ? {year} : {}})
    .then((response) => response.data);

/** Phân tích nội dung: bài thi hoạt động nhiều nhất & câu hỏi khó nhất. */
export const getContentInsights = () =>
  axios.get(`${BASE_DASHBOARD_URL}/content-insights`).then((response) => response.data);

/** Heatmap ngày×giờ cho 7 ngày kết thúc ở endDate (bỏ trống = hôm nay). */
export const getTrafficHeatmap = (endDate) =>
  axios
    .get(`${BASE_DASHBOARD_URL}/traffic-heatmap`, {params: endDate ? {endDate} : {}})
    .then((response) => response.data);
