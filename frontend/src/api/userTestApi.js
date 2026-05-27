import axios from './axiosClient';

const BASE_URL = '/api/user-tests';

export const getMyAttemptsByTest = (testId) => {
  return axios.get(`${BASE_URL}/my/by-test/${testId}`).then((res) => res.data);
};

export const getLeaderboardByTest = (testId) => {
  return axios.get(`${BASE_URL}/by-test/${testId}`).then((res) => res.data);
};

// ===== Exam engine (hỗ trợ chế độ guest qua isGuest + config) =====

export const checkActiveUserTest = (testId, isGuest, config = {}) => {
  const url = isGuest ? `${BASE_URL}/guest/check-active` : `${BASE_URL}/check-active`;
  return axios.get(url, { params: { testId }, ...config }).then((res) => res.data);
};

export const getUserTestMeta = (userTestId, isGuest, config = {}) => {
  const url = isGuest ? `${BASE_URL}/guest/${userTestId}` : `${BASE_URL}/${userTestId}`;
  return axios.get(url, config).then((res) => res.data);
};

export const startUserTest = (testId, isGuest, config = {}) => {
  const url = isGuest ? `${BASE_URL}/guest` : BASE_URL;
  return axios.post(url, { testId }, config).then((res) => res.data);
};

export const submitUserTest = (userTestId, isGuest, config = {}) => {
  const url = isGuest
    ? `${BASE_URL}/${userTestId}/guest-submit`
    : `${BASE_URL}/${userTestId}/submit`;
  return axios.post(url, null, config).then((res) => res.data);
};
