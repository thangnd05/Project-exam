import axios from './axiosClient';
import type { ExamPartRequest, ExamPartResponse } from '@/app/types';

const BASE_URL = '/api/exam-parts';
const ADMIN_BASE_URL = '/api/exam-parts';

export const getExamParts = (): Promise<ExamPartResponse[]> => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const getExamPartById = (examPartId: string): Promise<ExamPartResponse> => {
  return axios.get(`${BASE_URL}/${examPartId}`).then((response) => response.data);
};

export const getExamPartsByExamType = (examTypeId: string): Promise<ExamPartResponse[]> => {
  return axios.get(`${BASE_URL}/by-exam-type/${examTypeId}`).then((response) => response.data);
};

export const createExamPart = (payload: ExamPartRequest): Promise<ExamPartResponse> => {
  return axios.post(ADMIN_BASE_URL, payload).then((response) => response.data);
};

export const updateExamPart = (examPartId: string, payload: ExamPartRequest): Promise<ExamPartResponse> => {
  return axios
    .put(`${ADMIN_BASE_URL}/${examPartId}`, payload)
    .then((response) => response.data);
};

export const deleteExamPart = (examPartId: string): Promise<void> => {
  return axios.delete(`${ADMIN_BASE_URL}/${examPartId}`).then(() => {});
};
