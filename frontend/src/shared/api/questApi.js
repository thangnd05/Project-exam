import axios from './axiosClient';

const BASE_URL = '/api/quests';
const ADMIN_BASE_URL = '/api/admin/quests';

// Query key dùng chung cho danh sách nhiệm vụ của user (React Query cache).
export const QUESTS_QUERY_KEY = ['quests', 'me'];

export const getMyQuests = () => {
  return axios.get(`${BASE_URL}/me`).then((response) => response.data);
};

export const claimQuest = (questId) => {
  return axios.post(`${BASE_URL}/${questId}/claim`).then((response) => response.data);
};

export const getQuests = () => {
  return axios.get(ADMIN_BASE_URL).then((response) => response.data);
};

export const createQuest = (payload) => {
  return axios.post(ADMIN_BASE_URL, payload).then((response) => response.data);
};

export const updateQuest = (questId, payload) => {
  return axios.put(`${ADMIN_BASE_URL}/${questId}`, payload).then((response) => response.data);
};

export const deleteQuest = (questId) => {
  return axios.delete(`${ADMIN_BASE_URL}/${questId}`).then(() => {});
};
