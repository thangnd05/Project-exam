import axios from './axiosClient';
import type {
  AttemptCertificateResponse,
  CertificateResponse,
  CertificateTemplateRequest,
  CertificateTemplateResponse,
  CertificateVerifyResponse,
  MessageResponse,
  PageResponse,
} from '@/app/types';

const BASE_URL = '/api/certificates';
const ADMIN_BASE_URL = '/api/admin/certificates';

interface IssuedCertificateSearchParams {
  examTypeId?: string;
  status?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

export const getMyCertificates = (): Promise<CertificateResponse[]> => {
  return axios.get(`${BASE_URL}/me`).then((res) => res.data);
};

export const getCertificateById = (certificateId: string): Promise<CertificateResponse> => {
  return axios.get(`${BASE_URL}/${certificateId}`).then((res) => res.data);
};

/** Tra cứu công khai, không cần đăng nhập. */
export const verifyCertificate = (code: string): Promise<CertificateVerifyResponse> => {
  return axios.get(`${BASE_URL}/verify/${encodeURIComponent(code)}`).then((res) => res.data);
};

/** Trang kết quả hỏi lượt làm bài này có chứng chỉ chưa. */
export const getCertificateByAttempt = (userTestId: string): Promise<AttemptCertificateResponse> => {
  return axios.get(`${BASE_URL}/by-attempt/${userTestId}`).then((res) => res.data);
};

export const getCertificateTemplates = (): Promise<CertificateTemplateResponse[]> => {
  return axios.get(`${ADMIN_BASE_URL}/templates`).then((res) => res.data);
};

export const createCertificateTemplate = (payload: CertificateTemplateRequest): Promise<CertificateTemplateResponse> => {
  return axios.post(`${ADMIN_BASE_URL}/templates`, payload).then((res) => res.data);
};

export const updateCertificateTemplate = (templateId: string, payload: CertificateTemplateRequest): Promise<CertificateTemplateResponse> => {
  return axios.put(`${ADMIN_BASE_URL}/templates/${templateId}`, payload).then((res) => res.data);
};

export const deleteCertificateTemplate = (templateId: string): Promise<MessageResponse> => {
  return axios.delete(`${ADMIN_BASE_URL}/templates/${templateId}`).then((res) => res.data);
};

export const getIssuedCertificates = (params?: IssuedCertificateSearchParams): Promise<PageResponse<CertificateResponse>> => {
  return axios.get(ADMIN_BASE_URL, { params }).then((res) => res.data);
};

export const revokeCertificate = (certificateId: string, reason?: string): Promise<CertificateResponse> => {
  return axios.post(`${ADMIN_BASE_URL}/${certificateId}/revoke`, { reason }).then((res) => res.data);
};

/** Xoá hẳn chứng chỉ đã cấp (khác thu hồi: mã tra cứu biến mất luôn). */
export const deleteIssuedCertificate = (certificateId: string): Promise<MessageResponse> => {
  return axios.delete(`${ADMIN_BASE_URL}/${certificateId}`).then((res) => res.data);
};
