import axios from './axiosClient';

const BASE_URL = '/api/chapters';

export const getChaptersByClass = (classId) => {
  return axios.get(`${BASE_URL}/class/${classId}`).then((res) => res.data);
};

export const getChapterById = (chapterId) => {
  return axios.get(`${BASE_URL}/${chapterId}`).then((res) => res.data);
};

export const createChapter = (payload) => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateChapter = (chapterId, payload) => {
  return axios.put(`${BASE_URL}/${chapterId}`, payload).then((res) => res.data);
};

export const deleteChapter = (chapterId) => {
  return axios.delete(`${BASE_URL}/${chapterId}`).then(() => {});
};
