import axios from './axiosClient';
import type { PassageMediaRequest, PassageMediaResponse } from '@/app/types';

const BASE = '/api/passage-media';
const ADMIN_BASE = '/api/admin/passage-media';

export const createPassageMedia = (request: PassageMediaRequest): Promise<PassageMediaResponse> =>
  axios.post(ADMIN_BASE, request).then((res) => res.data);

export const getPassageMediaById = (id: string): Promise<PassageMediaResponse> =>
  axios.get(`${BASE}/${id}`).then((res) => res.data);

export const getPassageMediaByPassageId = (passageId: string): Promise<PassageMediaResponse[]> =>
  axios.get(`${BASE}/by-passage/${passageId}`).then((res) => res.data);

export const updatePassageMedia = (id: string, request: PassageMediaRequest): Promise<PassageMediaResponse> =>
  axios.put(`${ADMIN_BASE}/${id}`, request).then((res) => res.data);

export const deletePassageMedia = (id: string): Promise<void> =>
  axios.delete(`${ADMIN_BASE}/${id}`).then(() => {});
