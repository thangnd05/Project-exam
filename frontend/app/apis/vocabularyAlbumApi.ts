import axios from './axiosClient';
import type { VocabularyAlbumRequest, VocabularyAlbumResponse } from '@/app/types';

const BASE_URL = '/api/vocabulary-albums';

/**
 * Khoá cache của album. Để cạnh API vì ba route (my-albums, albums/[albumId], practice/[albumId])
 * cùng invalidate nó — trước đây key nằm trong _hooks của my-albums nên hai route kia phải với
 * sang thư mục riêng của route khác.
 */
export const albumKeys = { my: ['my-albums'] };

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
