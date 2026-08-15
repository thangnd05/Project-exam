import axios from './axiosClient';
import type { ChapterRequest, ChapterResponse } from '@/app/types';

const BASE_URL = '/api/chapters';

export const getChaptersByClass = (classId: string): Promise<ChapterResponse[]> => {
  return axios.get(`${BASE_URL}/class/${classId}`).then((res) => res.data);
};

export const getChapterById = (chapterId: string): Promise<ChapterResponse> => {
  return axios.get(`${BASE_URL}/${chapterId}`).then((res) => res.data);
};

export const createChapter = (payload: ChapterRequest): Promise<ChapterResponse> => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateChapter = (chapterId: string, payload: ChapterRequest): Promise<ChapterResponse> => {
  return axios.put(`${BASE_URL}/${chapterId}`, payload).then((res) => res.data);
};

export const deleteChapter = (chapterId: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${chapterId}`).then(() => {});
};
