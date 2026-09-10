import axios from './axiosClient';
import type { SkillRequest, SkillResponse } from '@/app/types';

const BASE_URL = '/api/skills';
const ADMIN_BASE_URL = '/api/admin/skills';

export const getSkills = (): Promise<SkillResponse[]> => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const createSkill = (payload: SkillRequest): Promise<SkillResponse> => {
  return axios.post(ADMIN_BASE_URL, payload).then((response) => response.data);
};

export const updateSkill = (skillId: string, payload: SkillRequest): Promise<SkillResponse> => {
  return axios.put(`${ADMIN_BASE_URL}/${skillId}`, payload).then((response) => response.data);
};

export const deleteSkill = (skillId: string): Promise<void> => {
  return axios.delete(`${ADMIN_BASE_URL}/${skillId}`).then(() => {});
};
