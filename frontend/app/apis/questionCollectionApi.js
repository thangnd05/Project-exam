import axios from './axiosClient';

const BASE_URL = '/api/question-collections';

export const getQuestionCollections = () => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const createQuestionCollection = (payload) => {
  return axios.post(BASE_URL, payload).then((response) => response.data);
};

export const updateQuestionCollection = (collectionId, payload) => {
  return axios.put(`${BASE_URL}/${collectionId}`, payload).then((response) => response.data);
};

export const deleteQuestionCollection = (collectionId) => {
  return axios.delete(`${BASE_URL}/${collectionId}`).then(() => {});
};
