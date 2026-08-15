import axios from './axiosClient';

const BASE_URL = '/api/certificates';
const ADMIN_BASE_URL = '/api/admin/certificates';

export const getMyCertificates = () => {
  return axios.get(`${BASE_URL}/me`).then((res) => res.data);
};

export const getCertificateById = (certificateId) => {
  return axios.get(`${BASE_URL}/${certificateId}`).then((res) => res.data);
};

/** Tra cứu công khai, không cần đăng nhập. */
export const verifyCertificate = (code) => {
  return axios.get(`${BASE_URL}/verify/${encodeURIComponent(code)}`).then((res) => res.data);
};

/** Trang kết quả hỏi lượt làm bài này có chứng chỉ chưa. */
export const getCertificateByAttempt = (userTestId) => {
  return axios.get(`${BASE_URL}/by-attempt/${userTestId}`).then((res) => res.data);
};

export const getCertificateTemplates = () => {
  return axios.get(`${ADMIN_BASE_URL}/templates`).then((res) => res.data);
};

export const createCertificateTemplate = (payload) => {
  return axios.post(`${ADMIN_BASE_URL}/templates`, payload).then((res) => res.data);
};

export const updateCertificateTemplate = (templateId, payload) => {
  return axios.put(`${ADMIN_BASE_URL}/templates/${templateId}`, payload).then((res) => res.data);
};

export const deleteCertificateTemplate = (templateId) => {
  return axios.delete(`${ADMIN_BASE_URL}/templates/${templateId}`).then((res) => res.data);
};

export const getIssuedCertificates = (params) => {
  return axios.get(ADMIN_BASE_URL, { params }).then((res) => res.data);
};

export const revokeCertificate = (certificateId, reason) => {
  return axios.post(`${ADMIN_BASE_URL}/${certificateId}/revoke`, { reason }).then((res) => res.data);
};
