import type { AxiosRequestConfig } from 'axios';
import axios from './axiosClient';
import type {
  NormalQuestionRequest,
  PassageQuestionGroupRequest,
  QuestionAdminResponse,
  QuestionCreateRequest,
  QuestionResponse,
} from '@/app/types';

const BASE_URL = '/api/questions';
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

interface QuestionBankFilterParams {
  classId?: string;
  chapterId?: string;
  bank?: string;
}

export const getQuestionsByPart = (partId: string, params: QuestionBankFilterParams = {}): Promise<QuestionResponse[]> => {
  return axios.get(`${BASE_URL}/by-part/${partId}`, { params }).then((res) => res.data);
};

export const getMyClassBankQuestions = (params: QuestionBankFilterParams = {}): Promise<QuestionResponse[]> => {
  return axios.get(`${BASE_URL}/bank/my-class`, { params }).then((res) => res.data);
};

export const getMyClassBankCount = (params: QuestionBankFilterParams = {}): Promise<number> => {
  return axios.get(`${BASE_URL}/bank/my-class/count`, { params }).then((res) => res.data);
};

export const getQuestionById = (questionId: string): Promise<QuestionAdminResponse> => {
  return axios.get(`${BASE_URL}/${questionId}`).then((res) => res.data);
};

export const deleteQuestion = (questionId: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${questionId}`).then(() => {});
};

export const updateQuestion = (questionId: string, data: QuestionCreateRequest | FormData, config: AxiosRequestConfig = {}): Promise<QuestionAdminResponse> => {
  return axios.put(`${BASE_URL}/${questionId}`, data, config).then((res) => res.data);
};

export const previewDocument = (formData: FormData): Promise<NormalQuestionRequest[]> => {
  return axios.post(`${BASE_URL}/preview/document`, formData, MULTIPART).then((res) => res.data);
};

export const previewPassageDocument = (formData: FormData): Promise<PassageQuestionGroupRequest[]> => {
  return axios.post(`${BASE_URL}/preview/passage-document`, formData, MULTIPART).then((res) => res.data);
};

export const createAndAttachDocument = (formData: FormData): Promise<QuestionAdminResponse[]> => {
  return axios.post(`${BASE_URL}/create-and-attach/document`, formData, MULTIPART).then((res) => res.data);
};

export const createAndAttach = (formData: FormData): Promise<QuestionAdminResponse> => {
  return axios.post(`${BASE_URL}/create-and-attach`, formData, MULTIPART).then((res) => res.data);
};

export const bulkCreateQuestions = (formData: FormData): Promise<QuestionAdminResponse[]> => {
  return axios.post(`${BASE_URL}/bulk`, formData, MULTIPART).then((res) => res.data);
};

export const bulkCreateQuestionGroups = (formData: FormData): Promise<QuestionAdminResponse[]> => {
  return axios.post(`${BASE_URL}/bulk-groups`, formData, MULTIPART).then((res) => res.data);
};
