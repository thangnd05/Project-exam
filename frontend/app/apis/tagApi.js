import axios from './axiosClient';

const BASE_URL = '/api/tags';

export const getTagTreeByExamType = (examTypeId) => {
  return axios.get(`${BASE_URL}/tree/${examTypeId}`).then((res) => res.data);
};

export const getTagsFlatByExamType = (examTypeId) => {
  return axios.get(`${BASE_URL}/flat/${examTypeId}`).then((res) => res.data);
};

export const createTag = (payload) => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateTag = (tagId, payload) => {
  return axios.put(`${BASE_URL}/${tagId}`, payload).then((res) => res.data);
};

export const deleteTag = (tagId) => {
  return axios.delete(`${BASE_URL}/${tagId}`).then(() => {});
};
