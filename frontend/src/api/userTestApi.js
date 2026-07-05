import axios from './axiosClient';

const BASE_URL = '/api/user-tests';

export const getMyUserTests = () => {
  return axios.get(`${BASE_URL}/my`).then((res) => res.data);
};

export const getMyAttemptsByTest = (testId) => {
  return axios.get(`${BASE_URL}/my/by-test/${testId}`).then((res) => res.data);
};

export const getLeaderboardByTest = (testId) => {
  return axios.get(`${BASE_URL}/by-test/${testId}`).then((res) => res.data);
};

// ===== Exam engine (hỗ trợ chế độ guest qua isGuest + config) =====

export const checkActiveUserTest = (testId, isGuest, config = {}, { mode, examPartIds } = {}) => {
  const url = isGuest ? `${BASE_URL}/guest/check-active` : `${BASE_URL}/check-active`;
  const params = { testId };
  // Guest luôn full-test; chỉ user mới có chế độ practice theo Part.
  if (!isGuest && mode) params.mode = mode;
  // Gửi CSV để Spring bind thẳng vào List<String> (tránh serialize kiểu examPartIds[]=).
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
  // Guest luôn full-test; practice theo Part chỉ cho user đăng nhập.
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

// Gắn bài làm của phiên guest vào tài khoản vừa đăng nhập (yêu cầu đã login).
// Gọi ngay sau login/OAuth thành công; BE nhận diện qua header X-Guest-Session.
export const claimGuestTests = (guestSessionId) => {
  return axios
    .post(`${BASE_URL}/claim-guest`, null, {
      headers: { 'X-Guest-Session': guestSessionId },
    })
    .then((res) => res.data);
};
