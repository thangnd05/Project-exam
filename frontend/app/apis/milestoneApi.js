import axios from './axiosClient';

const BASE_URL = '/api/milestones';

export const getMilestones = (examTypeId) => {
  return axios.get(BASE_URL, { params: { examTypeId } }).then((res) => res.data);
};

export const getMilestoneById = (id) => {
  return axios.get(`${BASE_URL}/${id}`).then((res) => res.data);
};

export const createMilestone = (payload) => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateMilestone = (id, payload) => {
  return axios.put(`${BASE_URL}/${id}`, payload).then((res) => res.data);
};

export const deleteMilestone = (id) => {
  return axios.delete(`${BASE_URL}/${id}`).then(() => {});
};
