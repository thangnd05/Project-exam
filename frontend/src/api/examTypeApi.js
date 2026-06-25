import axios from './axiosClient';

const BASE_URL = '/api/exam-types';

export const getExamTypes = () => {
  return axios.get(BASE_URL).then((response) => response.data);
};

// Loại kỳ thi chuẩn (flexible=false) — ẩn loại linh hoạt như "Thông Thường".
export const getStandardExamTypes = () => {
  return axios.get(`${BASE_URL}/standard`).then((response) => response.data);
};

// Loại kỳ thi linh hoạt (flexible=true).
export const getFlexibleExamTypes = () => {
  return axios.get(`${BASE_URL}/flexible`).then((response) => response.data);
};

export const getExamTypeById = (examTypeId) => {
  return axios.get(`${BASE_URL}/${examTypeId}`).then((response) => response.data);
};

// Các loại kỳ thi con của 1 loại cha (drill-in vd "AWS" → các cert).
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
