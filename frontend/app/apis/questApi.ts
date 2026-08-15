import axios from './axiosClient';
import type { QuestClaimResponse, QuestRequest, QuestResponse, UserQuestResponse } from '@/app/types';

const BASE_URL = '/api/quests';
const ADMIN_BASE_URL = '/api/admin/quests';

export const QUESTS_QUERY_KEY = ['quests', 'me'];

export const getMyQuests = (): Promise<UserQuestResponse[]> => {
  return axios.get(`${BASE_URL}/me`).then((response) => response.data);
};

export const claimQuest = (questId: string): Promise<QuestClaimResponse> => {
  return axios.post(`${BASE_URL}/${questId}/claim`).then((response) => response.data);
};

export const getQuests = (): Promise<QuestResponse[]> => {
  return axios.get(ADMIN_BASE_URL).then((response) => response.data);
};

export const createQuest = (payload: QuestRequest): Promise<QuestResponse> => {
  return axios.post(ADMIN_BASE_URL, payload).then((response) => response.data);
};

export const updateQuest = (questId: string, payload: QuestRequest): Promise<QuestResponse> => {
  return axios.put(`${ADMIN_BASE_URL}/${questId}`, payload).then((response) => response.data);
};

export const deleteQuest = (questId: string): Promise<void> => {
  return axios.delete(`${ADMIN_BASE_URL}/${questId}`).then(() => {});
};
