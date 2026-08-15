import type { AxiosResponse } from 'axios';
import axios from './axiosClient';
import { getGuestSessionId } from '@/app/utils/guestSession';
import type { EnhancedResultResponse } from '@/app/types';

export const getEnhancedResult = (userTestId: string): Promise<AxiosResponse<EnhancedResultResponse>> => {
  return axios.get(`/api/user-answers/user-test/${userTestId}/result/enhanced`);
};

export const getGuestEnhancedResult = (userTestId: string): Promise<AxiosResponse<EnhancedResultResponse>> => {
  const guestSessionId = getGuestSessionId();
  return axios.get(`/api/user-answers/guest/user-test/${userTestId}/result/enhanced`, {
    headers: { 'X-Guest-Session': guestSessionId },
  });
};
