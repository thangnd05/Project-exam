import axios from '~/shared/api/axiosClient';

const BASE_URL = '/api/practice-questions';

export const generatePracticeQuestion = (albumId) => {
  return axios.get(`${BASE_URL}/generate/${albumId}`).then((res) => res.data || null);
};

export const checkPracticeAnswer = (payload) => {
  return axios.post(`${BASE_URL}/check`, payload).then((res) => res.data);
};

export const markVocabKnown = (vocabId) => {
  return axios.post(`${BASE_URL}/mark-known/${vocabId}`, {}).then((res) => res.data);
};
