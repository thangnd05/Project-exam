import axios from './axiosClient';
import type { ExamTypeLayoutResponse, ExamTypeRequest, ExamTypeResponse } from '@/app/types';

const BASE_URL = '/api/exam-types';

export const getExamTypes = (): Promise<ExamTypeResponse[]> => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const getStandardExamTypes = (): Promise<ExamTypeResponse[]> => {
  return axios.get(`${BASE_URL}/standard`).then((response) => response.data);
};

export const getFlexibleExamTypes = (): Promise<ExamTypeResponse[]> => {
  return axios.get(`${BASE_URL}/flexible`).then((response) => response.data);
};

export const getExamTypeById = (examTypeId: string): Promise<ExamTypeResponse> => {
  return axios.get(`${BASE_URL}/${examTypeId}`).then((response) => response.data);
};

export const getExamTypeChildren = (examTypeId: string): Promise<ExamTypeResponse[]> => {
  return axios.get(`${BASE_URL}/${examTypeId}/children`).then((response) => response.data);
};

export const createExamType = (payload: ExamTypeRequest): Promise<ExamTypeResponse> => {
  return axios.post(BASE_URL, payload).then((response) => response.data);
};

export const updateExamType = (examTypeId: string, payload: ExamTypeRequest): Promise<ExamTypeResponse> => {
  return axios
    .put(`${BASE_URL}/${examTypeId}`, payload)
    .then((response) => response.data);
};

export const deleteExamType = (examTypeId: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${examTypeId}`).then(() => {});
};

export const getExamTypeLayout = (examTypeId: string): Promise<ExamTypeLayoutResponse | null> => {
  return axios
    .get(`${BASE_URL}/${examTypeId}/layout`)
    .then((res) => (res.status === 204 ? null : res.data))
    .catch((err) => {
      if (err?.response?.status === 404) return null;
      throw err;
    });
};

export const getOwnExamTypeLayout = (examTypeId: string): Promise<ExamTypeLayoutResponse | null> => {
  return axios
    .get(`${BASE_URL}/${examTypeId}/layout/own`)
    .then((res) => (res.status === 204 ? null : res.data));
};

export const updateExamTypeLayout = (examTypeId: string, config?: string): Promise<ExamTypeLayoutResponse> => {
  return axios
    .put(`${BASE_URL}/${examTypeId}/layout`, { config })
    .then((res) => res.data);
};
