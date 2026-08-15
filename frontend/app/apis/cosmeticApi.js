import axios from './axiosClient';

const BASE_URL = '/api/cosmetics';
const ADMIN_BASE_URL = '/api/admin/cosmetics';

export const getCosmeticShop = () => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const getMyEquippedCosmetics = () => {
  return axios.get(`${BASE_URL}/me/equipped`).then((response) => response.data);
};

export const buyCosmetic = (cosmeticId) => {
  return axios.post(`${BASE_URL}/${cosmeticId}/buy`).then((response) => response.data);
};

export const equipCosmetic = (cosmeticId) => {
  return axios.post(`${BASE_URL}/${cosmeticId}/equip`).then(() => {});
};

export const unequipCosmetic = (cosmeticId) => {
  return axios.post(`${BASE_URL}/${cosmeticId}/unequip`).then(() => {});
};

export const getCosmetics = () => {
  return axios.get(ADMIN_BASE_URL).then((response) => response.data);
};

export const createCosmetic = (payload) => {
  return axios.post(ADMIN_BASE_URL, payload).then((response) => response.data);
};

export const updateCosmetic = (cosmeticId, payload) => {
  return axios.put(`${ADMIN_BASE_URL}/${cosmeticId}`, payload).then((response) => response.data);
};

export const deleteCosmetic = (cosmeticId) => {
  return axios.delete(`${ADMIN_BASE_URL}/${cosmeticId}`).then(() => {});
};
