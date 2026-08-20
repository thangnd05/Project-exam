import axios from './axiosClient';
import type {
  AuthMessageResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from '@/app/types';

const BASE_URL = '/api/auth';
const FORM_URLENCODED = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

export const getCurrentUser = (): Promise<UserResponse> => {
  return axios.get(`${BASE_URL}/me`).then((res) => res.data);
};

export const login = (payload: LoginRequest): Promise<UserResponse> => {
  return axios.post(`${BASE_URL}/login`, payload).then((res) => res.data);
};

export const register = (payload: RegisterRequest): Promise<AuthMessageResponse> => {
  return axios.post(`${BASE_URL}/register`, payload).then((res) => res.data);
};

export const logout = (): Promise<AuthMessageResponse> => {
  return axios.post(`${BASE_URL}/logout`).then((res) => res.data);
};

export const refresh = (): Promise<AuthMessageResponse> => {
  return axios.post(`${BASE_URL}/refresh`).then((res) => res.data);
};

export const changePassword = (payload: ChangePasswordRequest): Promise<AuthMessageResponse> => {
  return axios.post(`${BASE_URL}/change-password`, payload).then((res) => res.data);
};

export const forgotPassword = (email: string): Promise<AuthMessageResponse> => {
  const params = new URLSearchParams();
  params.append('email', email);
  return axios.post(`${BASE_URL}/forgot-password`, params, FORM_URLENCODED).then((res) => res.data);
};

export const resetPassword = (token: string, newPassword: string): Promise<AuthMessageResponse> => {
  const params = new URLSearchParams();
  params.append('token', token);
  params.append('newPassword', newPassword);
  return axios.post(`${BASE_URL}/reset-password`, params, FORM_URLENCODED).then((res) => res.data);
};
