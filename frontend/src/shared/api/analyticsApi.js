import axios from '~/shared/api/axiosClient';
import {getOrCreateVisitorId} from '~/shared/utils/visitorId';

/**
 * Ghi nhận 1 lượt xem trang (fire-and-forget). Gửi analyticsVisitorId (mã khách ổn định, KHÔNG
 * bị xoá khi login/logout) làm định danh phiên cho khách; user đã đăng nhập thì backend gom theo
 * userId. Không chặn UI, nuốt mọi lỗi.
 */
export const trackVisit = (path) => {
  const visitorId = getOrCreateVisitorId();
  return axios
    .post('/api/analytics/visit', {path}, {headers: {'X-Guest-Session': visitorId}})
    .catch(() => {});
};
