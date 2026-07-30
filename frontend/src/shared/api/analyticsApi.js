import axios from '~/shared/api/axiosClient';
import {getOrCreateVisitorId} from '~/shared/utils/visitorId';

export const trackVisit = (path) => {
  const visitorId = getOrCreateVisitorId();
  return axios
    .post('/api/analytics/visit', {path}, {headers: {'X-Guest-Session': visitorId}})
    .catch(() => {});
};
