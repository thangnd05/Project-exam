import axios from './axiosClient';
import type { StreakRecoverConfigRequest, StreakRecoverConfigResponse, StreakResponse } from '@/app/types';

const BASE_URL = '/api/streak';
const ADMIN_BASE_URL = '/api/admin/streak/recover-config';

export const getMyStreak = (): Promise<StreakResponse> => {
  return axios.get(`${BASE_URL}/me`).then((response) => response.data);
};

export const restoreStreak = (): Promise<StreakResponse> => {
  return axios.post(`${BASE_URL}/restore`).then((response) => response.data);
};

export const getStreakRecoverConfig = (): Promise<StreakRecoverConfigResponse> => {
  return axios.get(ADMIN_BASE_URL).then((response) => response.data);
};

export const updateStreakRecoverConfig = (payload: StreakRecoverConfigRequest): Promise<StreakRecoverConfigResponse> => {
  return axios.put(ADMIN_BASE_URL, payload).then((response) => response.data);
};
