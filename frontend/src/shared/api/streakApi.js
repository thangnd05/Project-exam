import axios from './axiosClient';

const BASE_URL = '/api/streak';
const ADMIN_BASE_URL = '/api/admin/streak/recover-config';

export const getMyStreak = () => {
  return axios.get(`${BASE_URL}/me`).then((response) => response.data);
};

export const restoreStreak = () => {
  return axios.post(`${BASE_URL}/restore`).then((response) => response.data);
};

export const getStreakRecoverConfig = () => {
  return axios.get(ADMIN_BASE_URL).then((response) => response.data);
};

export const updateStreakRecoverConfig = (payload) => {
  return axios.put(ADMIN_BASE_URL, payload).then((response) => response.data);
};
