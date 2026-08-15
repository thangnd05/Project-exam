import axios from './axiosClient';
import type { TagRequest, TagResponse } from '@/app/types';

const BASE_URL = '/api/tags';

export const getTagTreeByExamType = (examTypeId: string): Promise<TagResponse[]> => {
  return axios.get(`${BASE_URL}/tree/${examTypeId}`).then((res) => res.data);
};

export const getTagsFlatByExamType = (examTypeId: string): Promise<TagResponse[]> => {
  return axios.get(`${BASE_URL}/flat/${examTypeId}`).then((res) => res.data);
};

export const createTag = (payload: TagRequest): Promise<TagResponse> => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateTag = (tagId: string, payload: TagRequest): Promise<TagResponse> => {
  return axios.put(`${BASE_URL}/${tagId}`, payload).then((res) => res.data);
};

export const deleteTag = (tagId: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${tagId}`).then(() => {});
};
