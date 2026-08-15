import axios from './axiosClient';

const BASE_URL = '/api/exam-types';

export const getExamTypes = () => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const getStandardExamTypes = () => {
  return axios.get(`${BASE_URL}/standard`).then((response) => response.data);
};

export const getFlexibleExamTypes = () => {
  return axios.get(`${BASE_URL}/flexible`).then((response) => response.data);
};

export const getExamTypeById = (examTypeId) => {
  return axios.get(`${BASE_URL}/${examTypeId}`).then((response) => response.data);
};

export const getExamTypeChildren = (examTypeId) => {
  return axios.get(`${BASE_URL}/${examTypeId}/children`).then((response) => response.data);
};

export const createExamType = (payload) => {
  return axios.post(BASE_URL, payload).then((response) => response.data);
};

export const updateExamType = (examTypeId, payload) => {
  return axios
    .put(`${BASE_URL}/${examTypeId}`, payload)
    .then((response) => response.data);
};

export const deleteExamType = (examTypeId) => {
  return axios.delete(`${BASE_URL}/${examTypeId}`).then(() => {});
};

export const getExamTypeLayout = (examTypeId) => {
  return axios
    .get(`${BASE_URL}/${examTypeId}/layout`)
    .then((res) => (res.status === 204 ? null : res.data))
    .catch((err) => {
      if (err?.response?.status === 404) return null;
      throw err;
    });
};

export const getOwnExamTypeLayout = (examTypeId) => {
  return axios
    .get(`${BASE_URL}/${examTypeId}/layout/own`)
    .then((res) => (res.status === 204 ? null : res.data));
};

export const updateExamTypeLayout = (examTypeId, config) => {
  return axios
    .put(`${BASE_URL}/${examTypeId}/layout`, { config })
    .then((res) => res.data);
};
