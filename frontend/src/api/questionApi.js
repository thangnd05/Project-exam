import axios from './axiosClient';

const BASE_URL = '/api/questions';
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

export const getQuestionsByPart = (partId, params = {}) => {
  return axios.get(`${BASE_URL}/by-part/${partId}`, { params }).then((res) => res.data);
};

export const getMyClassBankQuestions = (params = {}) => {
  return axios.get(`${BASE_URL}/bank/my-class`, { params }).then((res) => res.data);
};

export const getMyClassBankCount = (params = {}) => {
  return axios.get(`${BASE_URL}/bank/my-class/count`, { params }).then((res) => res.data);
};

export const getQuestionById = (questionId) => {
  return axios.get(`${BASE_URL}/${questionId}`).then((res) => res.data);
};

export const deleteQuestion = (questionId) => {
  return axios.delete(`${BASE_URL}/${questionId}`).then(() => {});
};

// data có thể là JSON payload hoặc FormData (multipart) — caller truyền config tương ứng.
export const updateQuestion = (questionId, data, config = {}) => {
  return axios.put(`${BASE_URL}/${questionId}`, data, config).then((res) => res.data);
};

// ===== Nạp/đọc từ file Word (multipart) =====

export const previewDocument = (formData) => {
  return axios.post(`${BASE_URL}/preview/document`, formData, MULTIPART).then((res) => res.data);
};

export const previewPassageDocument = (formData) => {
  return axios.post(`${BASE_URL}/preview/passage-document`, formData, MULTIPART).then((res) => res.data);
};

export const createAndAttachDocument = (formData) => {
  return axios.post(`${BASE_URL}/create-and-attach/document`, formData, MULTIPART).then((res) => res.data);
};

export const createAndAttach = (formData) => {
  return axios.post(`${BASE_URL}/create-and-attach`, formData, MULTIPART).then((res) => res.data);
};

export const bulkCreateQuestions = (formData) => {
  return axios.post(`${BASE_URL}/bulk`, formData, MULTIPART).then((res) => res.data);
};

export const bulkCreateQuestionGroups = (formData) => {
  return axios.post(`${BASE_URL}/bulk-groups`, formData, MULTIPART).then((res) => res.data);
};
