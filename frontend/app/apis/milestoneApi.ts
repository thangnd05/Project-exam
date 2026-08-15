import axios from './axiosClient';
import type { MilestoneRequest, MilestoneResponse } from '@/app/types';

const BASE_URL = '/api/milestones';

export const getMilestones = (examTypeId?: string): Promise<MilestoneResponse[]> => {
  return axios.get(BASE_URL, { params: { examTypeId } }).then((res) => res.data);
};

export const getMilestoneById = (id: string): Promise<MilestoneResponse> => {
  return axios.get(`${BASE_URL}/${id}`).then((res) => res.data);
};

export const createMilestone = (payload: MilestoneRequest): Promise<MilestoneResponse> => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateMilestone = (id: string, payload: MilestoneRequest): Promise<MilestoneResponse> => {
  return axios.put(`${BASE_URL}/${id}`, payload).then((res) => res.data);
};

export const deleteMilestone = (id: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${id}`).then(() => {});
};
