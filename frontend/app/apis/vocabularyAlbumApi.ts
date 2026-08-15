import axios from './axiosClient';
import type { VocabularyAlbumRequest, VocabularyAlbumResponse } from '@/app/types';

const BASE_URL = '/api/vocabulary-albums';

export const getMyAlbums = (): Promise<VocabularyAlbumResponse[]> => {
  return axios.get(`${BASE_URL}/my-albums`).then((res) => res.data);
};

export const createAlbum = (payload: VocabularyAlbumRequest): Promise<VocabularyAlbumResponse> => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateAlbum = (albumId: string, payload: VocabularyAlbumRequest): Promise<VocabularyAlbumResponse> => {
  return axios.put(`${BASE_URL}/${albumId}`, payload).then((res) => res.data);
};

export const deleteAlbum = (albumId: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${albumId}`).then(() => {});
};
