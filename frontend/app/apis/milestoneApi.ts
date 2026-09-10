import axios from './axiosClient';
import type { MilestoneRequest, MilestoneResponse } from '@/app/types';

const BASE_URL = '/api/milestones';
const ADMIN_BASE_URL = '/api/admin/milestones';

export const getMilestones = (examTypeId?: string): Promise<MilestoneResponse[]> => {
  return axios.get(BASE_URL, { params: { examTypeId } }).then((res) => res.data);
};

export const getMilestoneById = (id: string): Promise<MilestoneResponse> => {
  return axios.get(`${BASE_URL}/${id}`).then((res) => res.data);
};

export const createMilestone = (payload: MilestoneRequest): Promise<MilestoneResponse> => {
  return axios.post(ADMIN_BASE_URL, payload).then((res) => res.data);
};

export const updateMilestone = (id: string, payload: MilestoneRequest): Promise<MilestoneResponse> => {
  return axios.put(`${ADMIN_BASE_URL}/${id}`, payload).then((res) => res.data);
};

export const deleteMilestone = (id: string): Promise<void> => {
  return axios.delete(`${ADMIN_BASE_URL}/${id}`).then(() => {});
};
