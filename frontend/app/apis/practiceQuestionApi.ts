import axios from './axiosClient';
import type {
  MessageResponse,
  PracticeCheckRequest,
  PracticeCheckResponse,
  PracticeQuestionResponse,
} from '@/app/types';

const BASE_URL = '/api/practice-questions';

export const generatePracticeQuestion = (albumId: string): Promise<PracticeQuestionResponse | null> => {
  return axios.get(`${BASE_URL}/generate/${albumId}`).then((res) => res.data || null);
};

export const checkPracticeAnswer = (payload: PracticeCheckRequest): Promise<PracticeCheckResponse> => {
  return axios.post(`${BASE_URL}/check`, payload).then((res) => res.data);
};

export const markVocabKnown = (vocabId: string): Promise<MessageResponse> => {
  return axios.post(`${BASE_URL}/mark-known/${vocabId}`, {}).then((res) => res.data);
};
