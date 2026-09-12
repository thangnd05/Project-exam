import type { AxiosRequestConfig } from 'axios';
import axios from './axiosClient';
import type { QuestionUsageScope } from '@/app/enums';
import type {
  AdminQuestionListItem,
  AdminQuestionSearchParams,
  BulkUpdateQuestionsRequest,
  BulkUpdateQuestionsResponse,
  NormalQuestionRequest,
  PageResponse,
  PassageQuestionGroupRequest,
  QuestionAdminResponse,
  QuestionCreateRequest,
  QuestionJsonImportPreviewResponse,
  QuestionJsonImportRequest,
  QuestionResponse,
} from '@/app/types';

const BASE_URL = '/api/questions';

const ADMIN_BASE_URL = '/api/admin/questions';
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };
const JSON_BODY = { headers: { 'Content-Type': 'application/json' } };

interface QuestionBankFilterParams {
  classId?: string;
  chapterId?: string;
  bank?: string;
}

export interface QuestionJsonImportParams {
  examPartId: string;
  classId?: string;
  chapterId?: string;
  usageScope?: QuestionUsageScope;
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

/** Dry-run file JSON: trả về dữ liệu đã chuẩn hoá + toàn bộ lỗi/cảnh báo, không ghi database. */
export const previewJson = (
  payload: QuestionJsonImportRequest | string,
): Promise<QuestionJsonImportPreviewResponse> => {
  return axios.post(`${BASE_URL}/preview/json`, payload, JSON_BODY).then((res) => res.data);
};

export const previewJsonFile = (formData: FormData): Promise<QuestionJsonImportPreviewResponse> => {
  return axios.post(`${BASE_URL}/preview/json`, formData, MULTIPART).then((res) => res.data);
};

export const importJson = (
  payload: QuestionJsonImportRequest | string,
  params: QuestionJsonImportParams,
): Promise<QuestionAdminResponse[]> => {
  return axios.post(`${BASE_URL}/import/json`, payload, { ...JSON_BODY, params }).then((res) => res.data);
};

export const importJsonFile = (
  formData: FormData,
  params: QuestionJsonImportParams,
): Promise<QuestionAdminResponse[]> => {
  return axios.post(`${BASE_URL}/import/json`, formData, { ...MULTIPART, params }).then((res) => res.data);
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

export const UNCLASSIFIED_COLLECTION = '__NONE__';

export const searchAdminQuestions = (
  params: AdminQuestionSearchParams = {},
): Promise<PageResponse<AdminQuestionListItem>> => {
  return axios.get(`${ADMIN_BASE_URL}/search`, { params }).then((res) => res.data);
};

export const bulkUpdateQuestions = (
  payload: BulkUpdateQuestionsRequest,
): Promise<BulkUpdateQuestionsResponse> => {
  return axios.patch(`${ADMIN_BASE_URL}/bulk`, payload).then((res) => res.data);
};
