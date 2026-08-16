import type { AxiosRequestConfig } from 'axios';
import axios from './axiosClient';
import type {
  ActiveUserTestResponse,
  ClaimGuestTestsResponse,
  PageResponse,
  StartUserTestRequest,
  StartUserTestResponse,
  TestAdminResponse,
  TestLeaderboardResponse,
  UserTestResponse,
} from '@/app/types';
import type { UserTestMode } from '@/app/enums';

const BASE_URL = '/api/user-tests';

interface MyUserTestsParams {
  status?: string;
  examTypeId?: string;
}

interface StartTestOptions {
  mode?: UserTestMode;
  examPartIds?: string[];
}

export const getMyUserTests = (params: MyUserTestsParams = {}): Promise<UserTestResponse[]> => {
  return axios.get(`${BASE_URL}/my`, { params }).then((res) => res.data);
};

export const getMyCompletedUserTests = (examTypeId?: string): Promise<UserTestResponse[]> =>
  getMyUserTests({ status: 'COMPLETED', ...(examTypeId ? { examTypeId } : {}) });

export const getMockHistory = ({ page = 0, size = 10, examTypeId }: { page?: number; size?: number; examTypeId?: string } = {}): Promise<PageResponse<UserTestResponse>> => {
  const params: { page: number; size: number; examTypeId?: string } = { page, size };
  if (examTypeId) params.examTypeId = examTypeId;
  return axios.get(`${BASE_URL}/my/mock-history`, { params }).then((res) => res.data);
};

export const getMyAttemptsByTest = (testId: string): Promise<UserTestResponse[]> => {
  return axios.get(`${BASE_URL}/my/by-test/${testId}`).then((res) => res.data);
};

export const getLeaderboardByTest = (testId: string): Promise<TestLeaderboardResponse> => {
  return axios.get(`${BASE_URL}/by-test/${testId}`).then((res) => res.data);
};

export const checkActiveUserTest = (testId: string, isGuest?: boolean, config: AxiosRequestConfig = {}, { mode, examPartIds }: StartTestOptions = {}): Promise<ActiveUserTestResponse> => {
  const url = isGuest ? `${BASE_URL}/guest/check-active` : `${BASE_URL}/check-active`;
  const params: { testId: string; mode?: UserTestMode; examPartIds?: string } = { testId };

  if (!isGuest && mode) params.mode = mode;

  if (!isGuest && examPartIds && examPartIds.length) params.examPartIds = examPartIds.join(',');
  return axios.get(url, { params, ...config }).then((res) => res.data);
};

export const getUserTestMeta = (userTestId: string, isGuest?: boolean, config: AxiosRequestConfig = {}): Promise<UserTestResponse> => {
  const url = isGuest ? `${BASE_URL}/guest/${userTestId}` : `${BASE_URL}/${userTestId}`;
  return axios.get(url, config).then((res) => res.data);
};

export const getReviewTest = (userTestId: string, isGuest?: boolean, config: AxiosRequestConfig = {}): Promise<TestAdminResponse> => {
  const url = isGuest
    ? `${BASE_URL}/guest/${userTestId}/review-test`
    : `${BASE_URL}/${userTestId}/review-test`;
  return axios.get(url, config).then((res) => res.data);
};

export const startUserTest = (testId: string, isGuest?: boolean, config: AxiosRequestConfig = {}, { mode, examPartIds }: StartTestOptions = {}): Promise<StartUserTestResponse> => {
  const url = isGuest ? `${BASE_URL}/guest` : BASE_URL;
  const body: StartUserTestRequest = { testId };

  if (!isGuest && mode) body.mode = mode;
  if (!isGuest && examPartIds && examPartIds.length) body.examPartIds = examPartIds;
  return axios.post(url, body, config).then((res) => res.data);
};

export const submitUserTest = (userTestId: string, isGuest?: boolean, config: AxiosRequestConfig = {}): Promise<UserTestResponse> => {
  const url = isGuest
    ? `${BASE_URL}/${userTestId}/guest-submit`
    : `${BASE_URL}/${userTestId}/submit`;
  return axios.post(url, null, config).then((res) => res.data);
};

export const claimGuestTests = (guestSessionId: string): Promise<ClaimGuestTestsResponse> => {
  return axios
    .post(`${BASE_URL}/claim-guest`, null, {
      headers: { 'X-Guest-Session': guestSessionId },
    })
    .then((res) => res.data);
};
