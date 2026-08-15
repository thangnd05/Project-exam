import type { AxiosRequestConfig } from 'axios';
import axios from './axiosClient';
import type { ResultSummaryResponse, UserAnswerRequest, UserAnswerResponse } from '@/app/types';

const BASE_URL = '/api/user-answers';

export const getAnswersByUserTest = (userTestId: string, isGuest?: boolean, config: AxiosRequestConfig = {}): Promise<UserAnswerResponse[]> => {
  const url = isGuest
    ? `${BASE_URL}/guest/user-test/${userTestId}`
    : `${BASE_URL}/user-test/${userTestId}`;
  return axios.get(url, config).then((res) => res.data);
};

export const getResultByUserTest = (userTestId: string, isGuest?: boolean, config: AxiosRequestConfig = {}): Promise<ResultSummaryResponse> => {
  const url = isGuest
    ? `${BASE_URL}/guest/user-test/${userTestId}/result`
    : `${BASE_URL}/user-test/${userTestId}/result`;
  return axios.get(url, config).then((res) => res.data);
};

export const batchSaveAnswers = (payload: UserAnswerRequest[], isGuest?: boolean, config: AxiosRequestConfig = {}): Promise<UserAnswerResponse[]> => {
  const url = isGuest ? `${BASE_URL}/guest/batch` : `${BASE_URL}/batch`;
  return axios.post(url, payload, config).then((res) => res.data);
};
