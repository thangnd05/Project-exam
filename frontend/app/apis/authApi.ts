import axios from './axiosClient';
import type {
  AuthMessageResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ResetTokenStatus,
  UserResponse,
} from '@/app/types';

const BASE_URL = '/api/auth';

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
  return axios.post(`${BASE_URL}/forgot-password`, { email }).then((res) => res.data);
};

export const checkResetToken = (token: string): Promise<ResetTokenStatus> => {
  return axios
    .get(`${BASE_URL}/reset-password/check`, { params: { token } })
    .then((res) => res.data);
};

export const resetPassword = (payload: ResetPasswordRequest): Promise<AuthMessageResponse> => {
  return axios.post(`${BASE_URL}/reset-password`, payload).then((res) => res.data);
};
