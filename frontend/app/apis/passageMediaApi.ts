import axios from './axiosClient';
import type { PassageMediaRequest, PassageMediaResponse } from '@/app/types';

const BASE = '/api/passage-media';

export const createPassageMedia = (request: PassageMediaRequest): Promise<PassageMediaResponse> =>
  axios.post(BASE, request).then((res) => res.data);

export const getPassageMediaById = (id: string): Promise<PassageMediaResponse> =>
  axios.get(`${BASE}/${id}`).then((res) => res.data);

export const getPassageMediaByPassageId = (passageId: string): Promise<PassageMediaResponse[]> =>
  axios.get(`${BASE}/by-passage/${passageId}`).then((res) => res.data);

export const updatePassageMedia = (id: string, request: PassageMediaRequest): Promise<PassageMediaResponse> =>
  axios.put(`${BASE}/${id}`, request).then((res) => res.data);

export const deletePassageMedia = (id: string): Promise<void> =>
  axios.delete(`${BASE}/${id}`).then(() => {});
