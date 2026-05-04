import axios from './axiosClient';

const BASE = '/api/passage-media';

/**
 * Tạo passage media mới.
 * @param {Object} request - PassageMediaRequest (passageId, mediaUrl, mediaType, ...)
 * @returns {Promise<Object>} PassageMediaResponse
 */
export const createPassageMedia = (request) =>
  axios.post(BASE, request).then((res) => res.data);

/**
 * Lấy passage media theo id.
 * @param {number} id - passageMediaId
 * @returns {Promise<Object>} PassageMediaResponse
 */
export const getPassageMediaById = (id) =>
  axios.get(`${BASE}/${id}`).then((res) => res.data);

/**
 * Lấy danh sách passage media theo passageId (bảng trung gian).
 * @param {number} passageId
 * @returns {Promise<Array>} List<PassageMediaResponse>
 */
export const getPassageMediaByPassageId = (passageId) =>
  axios.get(`${BASE}/by-passage/${passageId}`).then((res) => res.data);

/**
 * Cập nhật passage media.
 * @param {number} id - passageMediaId
 * @param {Object} request - PassageMediaRequest
 * @returns {Promise<Object>} PassageMediaResponse
 */
export const updatePassageMedia = (id, request) =>
  axios.put(`${BASE}/${id}`, request).then((res) => res.data);

/**
 * Xóa passage media.
 * @param {number} id - passageMediaId
 * @returns {Promise<void>}
 */
export const deletePassageMedia = (id) =>
  axios.delete(`${BASE}/${id}`).then(() => {});
