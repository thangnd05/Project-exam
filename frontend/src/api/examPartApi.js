import axios from './axiosClient';

const BASE_URL = '/api/exam-parts';
const ADMIN_BASE_URL = '/api/exam-parts';

export const getExamParts = () => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const createExamPart = (payload) => {
  return axios.post(ADMIN_BASE_URL, payload).then((response) => response.data);
};

export const updateExamPart = (examPartId, payload) => {
  return axios
    .put(`${ADMIN_BASE_URL}/${examPartId}`, payload)
    .then((response) => response.data);
};

export const deleteExamPart = (examPartId) => {
  return axios.delete(`${ADMIN_BASE_URL}/${examPartId}`).then(() => {});
};
