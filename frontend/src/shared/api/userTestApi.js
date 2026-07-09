import axios from './axiosClient';

const BASE_URL = '/api/user-tests';

export const getMyUserTests = () => {
  return axios.get(`${BASE_URL}/my`).then((res) => res.data);
};

// Lịch sử mock (phân trang) — BE đã loại luyện tập theo Part & Quick Challenge.
// Trả PageResponse: { content, currentPage, size, totalElements, totalPages, hasNext }.
export const getMockHistory = ({ page = 0, size = 10, examTypeId } = {}) => {
  const params = { page, size };
  if (examTypeId) params.examTypeId = examTypeId;
  return axios.get(`${BASE_URL}/my/mock-history`, { params }).then((res) => res.data);
};

export const getMyAttemptsByTest = (testId) => {
  return axios.get(`${BASE_URL}/my/by-test/${testId}`).then((res) => res.data);
};

export const getLeaderboardByTest = (testId) => {
  return axios.get(`${BASE_URL}/by-test/${testId}`).then((res) => res.data);
};

export const checkActiveUserTest = (testId, isGuest, config = {}, { mode, examPartIds } = {}) => {
  const url = isGuest ? `${BASE_URL}/guest/check-active` : `${BASE_URL}/check-active`;
  const params = { testId };

  if (!isGuest && mode) params.mode = mode;

  if (!isGuest && examPartIds && examPartIds.length) params.examPartIds = examPartIds.join(',');
  return axios.get(url, { params, ...config }).then((res) => res.data);
};

export const getUserTestMeta = (userTestId, isGuest, config = {}) => {
  const url = isGuest ? `${BASE_URL}/guest/${userTestId}` : `${BASE_URL}/${userTestId}`;
  return axios.get(url, config).then((res) => res.data);
};

export const startUserTest = (testId, isGuest, config = {}, { mode, examPartIds } = {}) => {
  const url = isGuest ? `${BASE_URL}/guest` : BASE_URL;
  const body = { testId };

  if (!isGuest && mode) body.mode = mode;
  if (!isGuest && examPartIds && examPartIds.length) body.examPartIds = examPartIds;
  return axios.post(url, body, config).then((res) => res.data);
};

export const submitUserTest = (userTestId, isGuest, config = {}) => {
  const url = isGuest
    ? `${BASE_URL}/${userTestId}/guest-submit`
    : `${BASE_URL}/${userTestId}/submit`;
  return axios.post(url, null, config).then((res) => res.data);
};

export const claimGuestTests = (guestSessionId) => {
  return axios
    .post(`${BASE_URL}/claim-guest`, null, {
      headers: { 'X-Guest-Session': guestSessionId },
    })
    .then((res) => res.data);
};
