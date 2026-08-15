import axios from '@/app/apis/axiosClient';
import {getOrCreateVisitorId} from '@/app/utils/visitorId';

export const trackVisit = (path) => {
  const visitorId = getOrCreateVisitorId();
  return axios
    .post('/api/analytics/visit', {path}, {headers: {'X-Guest-Session': visitorId}})
    .catch(() => {});
};
