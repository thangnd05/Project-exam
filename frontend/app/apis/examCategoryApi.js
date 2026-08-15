import axios from './axiosClient';

const BASE_URL = '/api/exam-categories';

export const getExamCategories = () => {
  return axios.get(BASE_URL).then((res) => res.data);
};

export const getExamCategoryById = (id) => {
  return axios.get(`${BASE_URL}/${id}`).then((res) => res.data);
};

export const createExamCategory = (payload) => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateExamCategory = (id, payload) => {
  return axios.put(`${BASE_URL}/${id}`, payload).then((res) => res.data);
};

export const deleteExamCategory = (id) => {
  return axios.delete(`${BASE_URL}/${id}`).then(() => {});
};
