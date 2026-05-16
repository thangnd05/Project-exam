import axios from './axiosClient';

const BASE_URL = '/api/recovery-resources';

export const getAllResources = () =>
  axios.get(BASE_URL).then((res) => res.data);

export const getResourceById = (id) =>
  axios.get(`${BASE_URL}/${id}`).then((res) => res.data);

export const getResourcesByTag = (tagId) =>
  axios.get(`${BASE_URL}/by-tag/${tagId}`).then((res) => res.data);

export const createResource = (request, file) => {
  const fd = new FormData();
  fd.append('request', JSON.stringify(request));
  if (file) fd.append('file', file);
  return axios
    .post(BASE_URL, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
};

export const updateResource = (resourceId, request, file) => {
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

export const deleteResource = (resourceId) =>
  axios.delete(`${BASE_URL}/${resourceId}`).then(() => {});
