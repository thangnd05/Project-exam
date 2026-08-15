import axios from './axiosClient';
import { getGuestSessionId } from '@/app/utils/guestSession';

export const getEnhancedResult = (userTestId) => {
  return axios.get(`/api/user-answers/user-test/${userTestId}/result/enhanced`);
};

export const getGuestEnhancedResult = (userTestId) => {
  const guestSessionId = getGuestSessionId();
  return axios.get(`/api/user-answers/guest/user-test/${userTestId}/result/enhanced`, {
    headers: { 'X-Guest-Session': guestSessionId },
  });
};
