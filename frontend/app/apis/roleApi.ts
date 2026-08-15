import axios from './axiosClient';
import type { RoleRequest, RoleResponse } from '@/app/types';

const BASE_URL = '/api/roles';

export const getRoles = (): Promise<RoleResponse[]> => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const createRole = (payload: RoleRequest): Promise<RoleResponse> => {
  return axios.post(BASE_URL, payload).then((response) => response.data);
};

export const updateRole = (roleId: string, payload: RoleRequest): Promise<RoleResponse> => {
  return axios
    .put(`${BASE_URL}/${roleId}`, payload)
    .then((response) => response.data);
};

export const deleteRole = (roleId: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${roleId}`).then(() => {});
};

export const updateRolePermissions = (roleId: string, codes: string[]): Promise<RoleResponse> => {
  return axios
    .put(`${BASE_URL}/${roleId}/permissions`, { codes })
    .then((response) => response.data);
};
