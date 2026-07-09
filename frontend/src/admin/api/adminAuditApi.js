import axios from '~/shared/api/axiosClient';

const BASE_AUDIT_URL = '/api/audits';

const buildParams = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    query.append(key, String(value));
  });
  return query.toString();
};

export const getAuditLogs = ({page = 0, size = 100, userId} = {}) => {
  const queryString = buildParams({page, size, userId});
  return axios
    .get(`${BASE_AUDIT_URL}${queryString ? `?${queryString}` : ''}`)
    .then((response) => response.data);
};

export const getLoginAuditLogs = ({page = 0, size = 100, userId} = {}) => {
  const queryString = buildParams({page, size, userId});
  return axios
    .get(`${BASE_AUDIT_URL}/login${queryString ? `?${queryString}` : ''}`)
    .then((response) => response.data);
};
