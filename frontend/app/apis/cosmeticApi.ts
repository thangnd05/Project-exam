import axios from './axiosClient';
import type { CosmeticRequest, CosmeticResponse, EquippedCosmeticsResponse } from '@/app/types';

const BASE_URL = '/api/cosmetics';
const ADMIN_BASE_URL = '/api/admin/cosmetics';

export const getCosmeticShop = (): Promise<CosmeticResponse[]> => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const getMyEquippedCosmetics = (): Promise<EquippedCosmeticsResponse> => {
  return axios.get(`${BASE_URL}/me/equipped`).then((response) => response.data);
};

export const buyCosmetic = (cosmeticId: string): Promise<CosmeticResponse> => {
  return axios.post(`${BASE_URL}/${cosmeticId}/buy`).then((response) => response.data);
};

export const equipCosmetic = (cosmeticId: string): Promise<void> => {
  return axios.post(`${BASE_URL}/${cosmeticId}/equip`).then(() => {});
};

export const unequipCosmetic = (cosmeticId: string): Promise<void> => {
  return axios.post(`${BASE_URL}/${cosmeticId}/unequip`).then(() => {});
};

export const getCosmetics = (): Promise<CosmeticResponse[]> => {
  return axios.get(ADMIN_BASE_URL).then((response) => response.data);
};

export const createCosmetic = (payload: CosmeticRequest): Promise<CosmeticResponse> => {
  return axios.post(ADMIN_BASE_URL, payload).then((response) => response.data);
};

export const updateCosmetic = (cosmeticId: string, payload: CosmeticRequest): Promise<CosmeticResponse> => {
  return axios.put(`${ADMIN_BASE_URL}/${cosmeticId}`, payload).then((response) => response.data);
};

export const deleteCosmetic = (cosmeticId: string): Promise<void> => {
  return axios.delete(`${ADMIN_BASE_URL}/${cosmeticId}`).then(() => {});
};
