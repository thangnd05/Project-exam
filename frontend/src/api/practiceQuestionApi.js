import axios from './axiosClient';

const BASE_URL = '/api/practice-questions';

// Trả về null khi hết câu hỏi (BE trả 204 No Content → body rỗng).
export const generatePracticeQuestion = (albumId) => {
  return axios.get(`${BASE_URL}/generate/${albumId}`).then((res) => res.data || null);
};

export const checkPracticeAnswer = (payload) => {
  return axios.post(`${BASE_URL}/check`, payload).then((res) => res.data);
};

export const markVocabKnown = (vocabId) => {
  return axios.post(`${BASE_URL}/mark-known/${vocabId}`, {}).then((res) => res.data);
};
