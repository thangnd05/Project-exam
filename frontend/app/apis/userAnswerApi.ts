import type { AxiosRequestConfig } from 'axios';
import axios from './axiosClient';
import { getApiBaseUrl } from '@/app/utils/mediaUrl';
import { getCookie } from '@/app/utils/cookie';
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

// Dùng cho lúc đóng tab: fetch keepalive thay cho navigator.sendBeacon vì beacon
// không gắn được header X-XSRF-TOKEN / X-Guest-Session mà backend bắt buộc.
// Giới hạn body của keepalive là 64KB, quá ngưỡng thì fetch tự reject.
export const sendAnswersOnExit = (
  payload: UserAnswerRequest[],
  isGuest?: boolean,
  guestSessionId?: string | null,
): void => {
  const path = isGuest ? `${BASE_URL}/guest/batch` : `${BASE_URL}/batch`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (isGuest) {
    if (!guestSessionId) return;
    headers['X-Guest-Session'] = guestSessionId;
  } else {
    const csrfToken = getCookie('XSRF-TOKEN');
    if (csrfToken) headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
  }

  try {
    void fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      keepalive: true,
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
  }
};
