import axios from './axiosClient';
import type { VocabularyRequest, VocabularyResponse } from '@/app/types';

const BASE_URL = '/api/vocabularies';

export const getVocabulariesByAlbum = (albumId: string): Promise<VocabularyResponse[]> => {
  return axios.get(`${BASE_URL}/album/${albumId}`).then((res) => res.data);
};

export const createVocabulary = (payload: VocabularyRequest): Promise<VocabularyResponse> => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateVocabulary = (vocabId: string, payload: VocabularyRequest): Promise<VocabularyResponse> => {
  return axios.put(`${BASE_URL}/${vocabId}`, payload).then((res) => res.data);
};

export const deleteVocabulary = (vocabId: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${vocabId}`).then(() => {});
};

export const standardizeVocabularies = (payload: Record<string, string>): Promise<Record<string, string>> => {
  return axios.post(`${BASE_URL}/standardize`, payload).then((res) => res.data);
};

export const bulkCreateVocabularies = (payload: VocabularyRequest[]): Promise<VocabularyResponse[]> => {
  return axios.post(`${BASE_URL}/bulk`, payload).then((res) => res.data);
};
