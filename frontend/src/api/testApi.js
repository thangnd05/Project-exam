import axios from './axiosClient';

const BASE_URL = '/api/tests';

export const getAdminTests = () => {
  return axios.get(`${BASE_URL}/admin`).then((res) => res.data);
};

export const getMyTests = ({ page = 0, size = 12 } = {}) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  return axios
    .get(`${BASE_URL}/my-tests?${params.toString()}`)
    .then((res) => res.data);
};

export const getTestsByExamType = (examTypeId, { page = 0, size = 12 } = {}) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  return axios
    .get(`${BASE_URL}/user/by-exam-type/${examTypeId}?${params.toString()}`)
    .then((res) => res.data);
};

// Danh sách bài Quick Challenge cho Hero landing page (public, guest gọi được)
export const getQuickChallengeTests = () => {
  return axios.get(`${BASE_URL}/quick-challenge`).then((res) => res.data);
};

export const getAdminTestById = (testId) => {
  return axios.get(`${BASE_URL}/admintest/${testId}`).then((res) => res.data);
};

export const getUserTestInfo = (testId) => {
  return axios.get(`${BASE_URL}/usertest/${testId}`).then((res) => res.data);
};

export const createTest = (payload) => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateTest = (testId, payload) => {
  return axios.put(`${BASE_URL}/${testId}`, payload).then((res) => res.data);
};

export const deleteTest = (testId) => {
  return axios.delete(`${BASE_URL}/${testId}`).then(() => {});
};

// Mua quyền làm bài trả phí bằng xu (mua 1 lần, mở khoá vĩnh viễn)
export const purchaseTestAccess = (testId) => {
  return axios.post(`${BASE_URL}/${testId}/purchase`).then((res) => res.data);
};

export const addRandomQuestionsToPart = (payload) => {
  return axios.post(`${BASE_URL}/parts/random-questions`, payload).then((res) => res.data);
};

export const addQuestionsToPart = (payload) => {
  return axios.post(`${BASE_URL}/parts/questions`, payload).then((res) => res.data);
};
