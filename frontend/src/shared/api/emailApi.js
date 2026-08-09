import axios from './axiosClient';

const ADMIN_BASE_URL = '/api/admin/emails';

export const getAutoEmails = () => {
  return axios.get(`${ADMIN_BASE_URL}/auto`).then((response) => response.data);
};

export const getManualEmails = ({page = 0, size = 10} = {}) => {
  return axios
    .get(`${ADMIN_BASE_URL}/manual`, {params: {page, size}})
    .then((response) => response.data);
};

export const getEmailRecipients = (emailId, {page = 0, size = 20} = {}) => {
  return axios
    .get(`${ADMIN_BASE_URL}/${emailId}/recipients`, {params: {page, size}})
    .then((response) => response.data);
};

/** Danh sách người dùng để chọn người nhận; lọc theo vai trò/premium làm ở phía giao diện. */
export const getEmailAudience = () => {
  return axios.get(`${ADMIN_BASE_URL}/audience`).then((response) => response.data);
};

export const createEmail = (payload) => {
  return axios.post(ADMIN_BASE_URL, payload).then((response) => response.data);
};

export const updateEmail = (emailId, payload) => {
  return axios.put(`${ADMIN_BASE_URL}/${emailId}`, payload).then((response) => response.data);
};

export const deleteEmail = (emailId) => {
  return axios.delete(`${ADMIN_BASE_URL}/${emailId}`).then(() => {});
};

export const sendEmail = (emailId, userIds) => {
  return axios
    .post(`${ADMIN_BASE_URL}/${emailId}/send`, {userIds})
    .then((response) => response.data);
};

export const retryFailedEmail = (emailId) => {
  return axios.post(`${ADMIN_BASE_URL}/${emailId}/retry-failed`).then((response) => response.data);
};

export const previewEmail = (payload) => {
  return axios.post(`${ADMIN_BASE_URL}/preview`, payload).then((response) => response.data);
};

export const testSendEmail = (emailId, payload) => {
  return axios.post(`${ADMIN_BASE_URL}/${emailId}/test-send`, payload).then(() => {});
};
