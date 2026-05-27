import axios from './axiosClient';

const BASE_URL = '/api/auth';
const FORM_URLENCODED = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

export const getCurrentUser = () => {
  return axios.get(`${BASE_URL}/me`).then((res) => res.data);
};

export const login = (payload) => {
  return axios.post(`${BASE_URL}/login`, payload).then((res) => res.data);
};

export const register = (payload) => {
  return axios.post(`${BASE_URL}/register`, payload).then((res) => res.data);
};

export const logout = () => {
  return axios.post(`${BASE_URL}/logout`).then((res) => res.data);
};

export const changePassword = (payload) => {
  return axios.post(`${BASE_URL}/change-password`, payload).then((res) => res.data);
};

export const verifyEmail = (token) => {
  return axios.get(`${BASE_URL}/verify?token=${token}`).then((res) => res.data);
};

export const forgotPassword = (email) => {
  const params = new URLSearchParams();
  params.append('email', email);
  return axios.post(`${BASE_URL}/forgot-password`, params, FORM_URLENCODED).then((res) => res.data);
};

export const resetPassword = (token, newPassword) => {
  const params = new URLSearchParams();
  params.append('token', token);
  params.append('newPassword', newPassword);
  return axios.post(`${BASE_URL}/reset-password`, params, FORM_URLENCODED).then((res) => res.data);
};
