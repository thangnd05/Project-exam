import axios from '~/shared/api/axiosClient';

const BASE_URL = '/api/class-members';

export const getMyClasses = () => {
  return axios.get(`${BASE_URL}/my-classes`).then((res) => res.data);
};

export const getMembersByClass = (classId) => {
  return axios.get(`${BASE_URL}/class/${classId}`).then((res) => res.data);
};

export const getPendingByClass = (classId) => {
  return axios.get(`${BASE_URL}/class/${classId}/pending`).then((res) => res.data);
};

export const joinClass = (payload) => {
  return axios.post(`${BASE_URL}/join`, payload).then((res) => res.data);
};

export const approveMember = (payload) => {
  return axios.put(`${BASE_URL}/approve`, payload).then((res) => res.data);
};

export const approveAllMembers = (classId) => {
  return axios.put(`${BASE_URL}/approve-all/${classId}`).then((res) => res.data);
};

export const removeMember = (payload) => {
  return axios.delete(`${BASE_URL}/remove`, { data: payload }).then(() => {});
};
