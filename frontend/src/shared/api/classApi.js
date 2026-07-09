import axios from './axiosClient';

const BASE_URL = '/api/classes';

export const getClassById = (classId) => {
  return axios.get(`${BASE_URL}/${classId}`).then((res) => res.data);
};

export const getMyClasses = () => {
  return axios.get(`${BASE_URL}/my`).then((res) => res.data);
};

export const createClass = (payload) => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateClass = (classId, payload) => {
  return axios.put(`${BASE_URL}/${classId}`, payload).then((res) => res.data);
};

export const deleteClass = (classId) => {
  return axios.delete(`${BASE_URL}/${classId}`).then(() => {});
};

export const getClassChapterTests = (classId, chapterId) => {
  return axios
    .get(`${BASE_URL}/${classId}/chapters/${chapterId}/tests`)
    .then((res) => res.data);
};
