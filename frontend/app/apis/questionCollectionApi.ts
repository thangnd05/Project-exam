import axios from './axiosClient';
import type { QuestionCollectionRequest, QuestionCollectionResponse } from '@/app/types';

const BASE_URL = '/api/question-collections';

export const getQuestionCollections = (): Promise<QuestionCollectionResponse[]> => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const createQuestionCollection = (payload: QuestionCollectionRequest): Promise<QuestionCollectionResponse> => {
  return axios.post(BASE_URL, payload).then((response) => response.data);
};

export const updateQuestionCollection = (collectionId: string, payload: QuestionCollectionRequest): Promise<QuestionCollectionResponse> => {
  return axios.put(`${BASE_URL}/${collectionId}`, payload).then((response) => response.data);
};

export const deleteQuestionCollection = (collectionId: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${collectionId}`).then(() => {});
};
