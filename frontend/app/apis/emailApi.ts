import axios from './axiosClient';
import type {
  EmailPreviewRequest,
  EmailPreviewResponse,
  EmailRecipientResponse,
  EmailResponse,
  EmailSaveRequest,
  MailAudienceOptionResponse,
  PageResponse,
} from '@/app/types';

const ADMIN_BASE_URL = '/api/admin/emails';

interface EmailPagingParams {
  page?: number;
  size?: number;
}

export const getAutoEmails = (): Promise<EmailResponse[]> => {
  return axios.get(`${ADMIN_BASE_URL}/auto`).then((response) => response.data);
};

export const getManualEmails = ({page = 0, size = 10}: EmailPagingParams = {}): Promise<PageResponse<EmailResponse>> => {
  return axios
    .get(`${ADMIN_BASE_URL}/manual`, {params: {page, size}})
    .then((response) => response.data);
};

export const getEmailRecipients = (emailId: string, {page = 0, size = 20}: EmailPagingParams = {}): Promise<PageResponse<EmailRecipientResponse>> => {
  return axios
    .get(`${ADMIN_BASE_URL}/${emailId}/recipients`, {params: {page, size}})
    .then((response) => response.data);
};

/** Danh sách người dùng để chọn người nhận; lọc theo vai trò/premium làm ở phía giao diện. */
export const getEmailAudience = (): Promise<MailAudienceOptionResponse[]> => {
  return axios.get(`${ADMIN_BASE_URL}/audience`).then((response) => response.data);
};

export const createEmail = (payload: EmailSaveRequest): Promise<EmailResponse> => {
  return axios.post(ADMIN_BASE_URL, payload).then((response) => response.data);
};

export const updateEmail = (emailId: string, payload: EmailSaveRequest): Promise<EmailResponse> => {
  return axios.put(`${ADMIN_BASE_URL}/${emailId}`, payload).then((response) => response.data);
};

export const deleteEmail = (emailId: string): Promise<void> => {
  return axios.delete(`${ADMIN_BASE_URL}/${emailId}`).then(() => {});
};

export const sendEmail = (emailId: string, userIds: string[]): Promise<EmailResponse> => {
  return axios
    .post(`${ADMIN_BASE_URL}/${emailId}/send`, {userIds})
    .then((response) => response.data);
};

export const retryFailedEmail = (emailId: string): Promise<EmailResponse> => {
  return axios.post(`${ADMIN_BASE_URL}/${emailId}/retry-failed`).then((response) => response.data);
};

export const previewEmail = (payload: EmailPreviewRequest): Promise<EmailPreviewResponse> => {
  return axios.post(`${ADMIN_BASE_URL}/preview`, payload).then((response) => response.data);
};

export const testSendEmail = (emailId: string, payload: EmailPreviewRequest): Promise<void> => {
  return axios.post(`${ADMIN_BASE_URL}/${emailId}/test-send`, payload).then(() => {});
};
