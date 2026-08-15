import axios from './axiosClient';
import type { RecoveryResourceRequest, RecoveryResourceResponse } from '@/app/types';

const BASE_URL = '/api/recovery-resources';

export const getAllResources = (): Promise<RecoveryResourceResponse[]> =>
  axios.get(BASE_URL).then((res) => res.data);

export const getResourceById = (id: string): Promise<RecoveryResourceResponse> =>
  axios.get(`${BASE_URL}/${id}`).then((res) => res.data);

export const getResourcesByTag = (tagId: string): Promise<RecoveryResourceResponse[]> =>
  axios.get(`${BASE_URL}/by-tag/${tagId}`).then((res) => res.data);

export const getResourcesByPart = (examPartId: string): Promise<RecoveryResourceResponse[]> =>
  axios.get(`${BASE_URL}/by-part/${examPartId}`).then((res) => res.data);

export const getResourcesByParts = (examPartIds?: string[] | null): Promise<RecoveryResourceResponse[]> =>
  axios
    .get(`${BASE_URL}/by-parts`, {
      params: { examPartIds: (examPartIds || []).join(',') },
    })
    .then((res) => res.data);

export const createResource = (request: RecoveryResourceRequest, file?: File | null): Promise<RecoveryResourceResponse> => {
  const fd = new FormData();
  fd.append('request', JSON.stringify(request));
  if (file) fd.append('file', file);
  return axios
    .post(BASE_URL, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
};

export const updateResource = (resourceId: string, request: RecoveryResourceRequest, file?: File | null): Promise<RecoveryResourceResponse> => {
  if (file) {
    const fd = new FormData();
    fd.append('request', JSON.stringify(request));
    fd.append('file', file);
    return axios
      .put(`${BASE_URL}/${resourceId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => res.data);
  }
  return axios.put(`${BASE_URL}/${resourceId}`, request).then((res) => res.data);
};

export const deleteResource = (resourceId: string): Promise<void> =>
  axios.delete(`${BASE_URL}/${resourceId}`).then(() => {});

export const viewResourceContent = (resourceId: string): Promise<string> =>
  axios
    .get(`${BASE_URL}/${resourceId}/view`, { responseType: 'text' })
    .then((res) => res.data);
