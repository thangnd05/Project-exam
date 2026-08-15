import axios from './axiosClient';
import type { ClassRequest, ClassResponse, ClassSimpleResponse, TestResponse } from '@/app/types';

const BASE_URL = '/api/classes';

export const getClassById = (classId: string): Promise<ClassResponse> => {
  return axios.get(`${BASE_URL}/${classId}`).then((res) => res.data);
};

export const getMyClasses = (): Promise<ClassSimpleResponse[]> => {
  return axios.get(`${BASE_URL}/my`).then((res) => res.data);
};

export const createClass = (payload: ClassRequest): Promise<ClassResponse> => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateClass = (classId: string, payload: ClassRequest): Promise<ClassResponse> => {
  return axios.put(`${BASE_URL}/${classId}`, payload).then((res) => res.data);
};

export const deleteClass = (classId: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${classId}`).then(() => {});
};

export const getClassChapterTests = (classId: string, chapterId: string): Promise<TestResponse[]> => {
  return axios
    .get(`${BASE_URL}/${classId}/chapters/${chapterId}/tests`)
    .then((res) => res.data);
};
