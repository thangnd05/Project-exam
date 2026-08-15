import axios from './axiosClient';
import type { PermissionResponse } from '@/app/types';

const BASE_URL = '/api/permissions';

export const getPermissions = (): Promise<PermissionResponse[]> => {
  return axios.get(BASE_URL).then((response) => response.data);
};
