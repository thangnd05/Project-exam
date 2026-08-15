import axios from './axiosClient';
import type {
  CoinBalanceRequest,
  CoinResponse,
  CoinUpsertRequest,
  CoinWalletResponse,
} from '@/app/types';

const BASE_URL = '/api/coins';
const ADMIN_BASE_URL = '/api/admin/coins';

export const getMyCoins = (): Promise<CoinResponse> => {
  return axios.get(`${BASE_URL}/me`).then((response) => response.data);
};

export const getCoinWallets = (): Promise<CoinWalletResponse[]> => {
  return axios.get(ADMIN_BASE_URL).then((response) => response.data);
};

export const createCoinWallet = (payload: CoinUpsertRequest): Promise<CoinWalletResponse> => {
  return axios.post(ADMIN_BASE_URL, payload).then((response) => response.data);
};

export const updateCoinBalance = (userId: string, payload: CoinBalanceRequest): Promise<CoinWalletResponse> => {
  return axios.put(`${ADMIN_BASE_URL}/${userId}`, payload).then((response) => response.data);
};

export const deleteCoinWallet = (userId: string): Promise<void> => {
  return axios.delete(`${ADMIN_BASE_URL}/${userId}`).then(() => {});
};
