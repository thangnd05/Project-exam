import axios from './axiosClient';

const BASE_URL = '/api/skills';

export const getSkills = () => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const createSkill = (payload) => {
  return axios.post(BASE_URL, payload).then((response) => response.data);
};

export const updateSkill = (skillId, payload) => {
  return axios.put(`${BASE_URL}/${skillId}`, payload).then((response) => response.data);
};

export const deleteSkill = (skillId) => {
  return axios.delete(`${BASE_URL}/${skillId}`).then(() => {});
};
