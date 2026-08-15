import axios from './axiosClient';

const BASE_URL = '/api/test-parts';

export const createTestPart = (payload) => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};
