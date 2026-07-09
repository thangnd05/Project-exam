import axios from './axiosClient';

const BASE_URL = '/api/coins';
const ADMIN_BASE_URL = '/api/admin/coins';

export const getMyCoins = () => {
  return axios.get(`${BASE_URL}/me`).then((response) => response.data);
};

export const getCoinWallets = () => {
  return axios.get(ADMIN_BASE_URL).then((response) => response.data);
};

export const createCoinWallet = (payload) => {
  return axios.post(ADMIN_BASE_URL, payload).then((response) => response.data);
};

export const updateCoinBalance = (userId, payload) => {
  return axios.put(`${ADMIN_BASE_URL}/${userId}`, payload).then((response) => response.data);
};

export const deleteCoinWallet = (userId) => {
  return axios.delete(`${ADMIN_BASE_URL}/${userId}`).then(() => {});
};
