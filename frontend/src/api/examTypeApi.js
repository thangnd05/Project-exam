import axios from './axiosClient';

const BASE_URL = '/api/exam-types';

export const getExamTypes = () => {
  return axios.get(BASE_URL).then((response) => response.data);
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
