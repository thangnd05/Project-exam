import axios from 'axios';

const BASE_URL = '/api/exam-types';
const ADMIN_BASE_URL = '/api/admin/exam-types';

export const getExamTypes = () => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const createExamType = (payload) => {
  return axios.post(ADMIN_BASE_URL, payload).then((response) => response.data);
};

export const updateExamType = (examTypeId, payload) => {
  return axios
    .put(`${ADMIN_BASE_URL}/${examTypeId}`, payload)
    .then((response) => response.data);
};

export const deleteExamType = (examTypeId) => {
  return axios.delete(`${ADMIN_BASE_URL}/${examTypeId}`).then(() => {});
};
