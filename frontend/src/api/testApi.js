import axios from './axiosClient';

const BASE_URL = '/api/tests';

export const getAdminTests = () => {
  return axios.get(`${BASE_URL}/admin`).then((res) => res.data);
};

export const getMyTests = () => {
  return axios.get(`${BASE_URL}/my-tests`).then((res) => res.data);
};

export const getTestsByExamType = (examTypeId) => {
  return axios.get(`${BASE_URL}/user/by-exam-type/${examTypeId}`).then((res) => res.data);
};

export const getAdminTestById = (testId) => {
  return axios.get(`${BASE_URL}/admintest/${testId}`).then((res) => res.data);
};

export const getUserTestInfo = (testId) => {
  return axios.get(`${BASE_URL}/usertest/${testId}`).then((res) => res.data);
};

export const createTest = (payload) => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateTest = (testId, payload) => {
  return axios.put(`${BASE_URL}/${testId}`, payload).then((res) => res.data);
};

export const deleteTest = (testId) => {
  return axios.delete(`${BASE_URL}/${testId}`).then(() => {});
};

export const addRandomQuestionsToPart = (payload) => {
  return axios.post(`${BASE_URL}/parts/random-questions`, payload).then((res) => res.data);
};

export const addQuestionsToPart = (payload) => {
  return axios.post(`${BASE_URL}/parts/questions`, payload).then((res) => res.data);
};
