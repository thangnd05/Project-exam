import axios from './axiosClient';
import type { ExamCategoryRequest, ExamCategoryResponse } from '@/app/types';

const BASE_URL = '/api/exam-categories';
const ADMIN_BASE_URL = '/api/admin/exam-categories';

export const getExamCategories = (): Promise<ExamCategoryResponse[]> => {
  return axios.get(BASE_URL).then((res) => res.data);
};

export const getExamCategoryById = (id: string): Promise<ExamCategoryResponse> => {
  return axios.get(`${BASE_URL}/${id}`).then((res) => res.data);
};

export const createExamCategory = (payload: ExamCategoryRequest): Promise<ExamCategoryResponse> => {
  return axios.post(ADMIN_BASE_URL, payload).then((res) => res.data);
};

export const updateExamCategory = (id: string, payload: ExamCategoryRequest): Promise<ExamCategoryResponse> => {
  return axios.put(`${ADMIN_BASE_URL}/${id}`, payload).then((res) => res.data);
};

export const deleteExamCategory = (id: string): Promise<void> => {
  return axios.delete(`${ADMIN_BASE_URL}/${id}`).then(() => {});
};
