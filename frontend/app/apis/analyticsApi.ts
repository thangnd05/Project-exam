import type { AxiosResponse } from 'axios';
import axios from '@/app/apis/axiosClient';
import {getOrCreateVisitorId} from '@/app/utils/visitorId';

export const trackVisit = (path: string): Promise<AxiosResponse<void> | void> => {
  const visitorId = getOrCreateVisitorId();
  return axios
    .post('/api/analytics/visit', {path}, {headers: {'X-Guest-Session': visitorId}})
    .catch(() => {});
};
