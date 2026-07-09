import axios from '~/shared/api/axiosClient';

const BASE_URL = '/api/vocabularies';

export const getVocabulariesByAlbum = (albumId) => {
  return axios.get(`${BASE_URL}/album/${albumId}`).then((res) => res.data);
};

export const createVocabulary = (payload) => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateVocabulary = (vocabId, payload) => {
  return axios.put(`${BASE_URL}/${vocabId}`, payload).then((res) => res.data);
};

export const deleteVocabulary = (vocabId) => {
  return axios.delete(`${BASE_URL}/${vocabId}`).then(() => {});
};

export const standardizeVocabularies = (payload) => {
  return axios.post(`${BASE_URL}/standardize`, payload).then((res) => res.data);
};

export const bulkCreateVocabularies = (payload) => {
  return axios.post(`${BASE_URL}/bulk`, payload).then((res) => res.data);
};
