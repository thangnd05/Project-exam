import axios from './axiosClient';

const BASE = '/api/passage-media';

export const createPassageMedia = (request) =>
  axios.post(BASE, request).then((res) => res.data);

export const getPassageMediaById = (id) =>
  axios.get(`${BASE}/${id}`).then((res) => res.data);

export const getPassageMediaByPassageId = (passageId) =>
  axios.get(`${BASE}/by-passage/${passageId}`).then((res) => res.data);

export const updatePassageMedia = (id, request) =>
  axios.put(`${BASE}/${id}`, request).then((res) => res.data);

export const deletePassageMedia = (id) =>
  axios.delete(`${BASE}/${id}`).then(() => {});
