import axios from './axiosClient';

const BASE_URL = '/api/streak';

// Streak của user đang đăng nhập: { currentStreak, longestStreak, lastActivityDate, increased }
export const getMyStreak = () => {
  return axios.get(`${BASE_URL}/me`).then((response) => response.data);
};
