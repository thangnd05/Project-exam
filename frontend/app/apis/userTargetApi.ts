import axios from './axiosClient';
import type { UserTargetRequest, UserTargetResponse } from '@/app/types';

const BASE_URL = '/api/user-targets';

export const getUserTarget = (examTypeId?: string): Promise<UserTargetResponse> => {
  return axios.get(BASE_URL, { params: { examTypeId } }).then((res) => res.data);
};

export const createOrUpdateUserTarget = (payload: UserTargetRequest): Promise<UserTargetResponse> => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const deleteUserTarget = (examTypeId?: string): Promise<void> => {
  return axios.delete(BASE_URL, { params: { examTypeId } }).then(() => {});
};
