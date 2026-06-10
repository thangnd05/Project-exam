import axios from './axiosClient';

const BASE_URL = '/api/streak';
const ADMIN_BASE_URL = '/api/admin/streak/recover-config';

// ----- User -----

// Streak của user đang đăng nhập:
// { currentStreak, longestStreak, lastActivityDate, increased, lostStreak, canRecover, recoverCost }
export const getMyStreak = () => {
  return axios.get(`${BASE_URL}/me`).then((response) => response.data);
};

// Khôi phục chuỗi đã đứt (tốn xu). Trả về streak sau khôi phục.
export const restoreStreak = () => {
  return axios.post(`${BASE_URL}/restore`).then((response) => response.data);
};

// ----- Admin -----

// Cấu hình khôi phục: { costCoins, active }
export const getStreakRecoverConfig = () => {
  return axios.get(ADMIN_BASE_URL).then((response) => response.data);
};

export const updateStreakRecoverConfig = (payload) => {
  return axios.put(ADMIN_BASE_URL, payload).then((response) => response.data);
};
