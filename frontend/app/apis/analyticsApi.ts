import type { AxiosResponse } from 'axios';
import axios from '@/app/apis/axiosClient';
import {getOrCreateVisitorId} from '@/app/utils/visitorId';

// identify = true: chỉ gắn người dùng vừa đăng nhập vào lượt hiện tại của phiên, không tính lượt mới.
export const trackVisit = (path: string, identify = false): Promise<AxiosResponse<void> | void> => {
  const visitorId = getOrCreateVisitorId();
  return axios
    .post('/api/analytics/visit', {path, identify}, {headers: {'X-Guest-Session': visitorId}})
    .catch(() => {});
};
