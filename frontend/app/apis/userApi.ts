import axios from './axiosClient';
import type {
  PageResponse,
  ProfileActivityResponse,
  ProfileOverviewResponse,
  UserResponse,
  UserUpsertRequest,
} from '@/app/types';

const BASE_URL = '/api/users';

interface UserListParams {
  page?: number;
  size?: number;
  keyword?: string;
  roleId?: string;
  verified?: boolean;
}

export const getUsers = ({page = 0, size = 10, keyword, roleId, verified}: UserListParams = {}): Promise<PageResponse<UserResponse>> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (keyword && keyword.trim()) {
    params.set('keyword', keyword.trim());
  }
  if (roleId && roleId !== 'all') {
    params.set('roleId', roleId);
  }
  if (verified === true || verified === false) {
    params.set('verified', String(verified));
  }

  return axios
    .get(`${BASE_URL}/paged?${params.toString()}`)
    .then((response) => response.data);
};

export const createUser = (payload: UserUpsertRequest): Promise<UserResponse> => {
  return axios.post(BASE_URL, payload).then((response) => response.data);
};

export const deleteUser = (userId: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${userId}`).then(() => {});
};

export const getProfileOverview = (): Promise<ProfileOverviewResponse> => {
  return axios.get(`${BASE_URL}/me/profile-overview`).then((response) => response.data);
};

export const getMyActivity = ({ month, year }: { month?: number | string; year?: number | string } = {}): Promise<ProfileActivityResponse> => {
  const params = new URLSearchParams();
  if (month) params.set('month', String(month));
  if (year) params.set('year', String(year));
  const query = params.toString();
  return axios
    .get(`${BASE_URL}/me/activity${query ? `?${query}` : ''}`)
    .then((response) => response.data);
};

export const getMyInfo = (): Promise<UserResponse> => {
  return axios.get(`${BASE_URL}/me/info-user`).then((response) => response.data);
};

export const updateUser = (userId: string, formData: FormData): Promise<UserResponse> => {
  return axios
    .put(`${BASE_URL}/${userId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((response) => response.data);
};
