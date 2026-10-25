import axios from './axiosClient';
import type { PassageMediaResponse } from '@/app/types';

const BASE = '/api/passage-media';
const ADMIN_BASE = '/api/admin/passage-media';

export const getPassageMediaByPassageId = (passageId: string): Promise<PassageMediaResponse[]> =>
  axios.get(`${BASE}/by-passage/${passageId}`).then((res) => res.data);

export const deletePassageMedia = (id: string): Promise<void> =>
  axios.delete(`${ADMIN_BASE}/${id}`).then(() => {});
