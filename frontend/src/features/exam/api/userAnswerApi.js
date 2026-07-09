import axios from '~/shared/api/axiosClient';

const BASE_URL = '/api/user-answers';

export const getAnswersByUserTest = (userTestId, isGuest, config = {}) => {
  const url = isGuest
    ? `${BASE_URL}/guest/user-test/${userTestId}`
    : `${BASE_URL}/user-test/${userTestId}`;
  return axios.get(url, config).then((res) => res.data);
};

export const getResultByUserTest = (userTestId, isGuest, config = {}) => {
  const url = isGuest
    ? `${BASE_URL}/guest/user-test/${userTestId}/result`
    : `${BASE_URL}/user-test/${userTestId}/result`;
  return axios.get(url, config).then((res) => res.data);
};

export const batchSaveAnswers = (payload, isGuest, config = {}) => {
  const url = isGuest ? `${BASE_URL}/guest/batch` : `${BASE_URL}/batch`;
  return axios.post(url, payload, config).then((res) => res.data);
};
