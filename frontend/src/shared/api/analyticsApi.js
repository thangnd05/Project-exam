import axios from '~/shared/api/axiosClient';
import {getOrCreateGuestSessionId, guestHeaders} from '~/shared/utils/guestSession';

/**
 * Ghi nhận 1 lượt xem trang (fire-and-forget). Dùng lại guestSessionId ở localStorage làm
 * định danh phiên để backend đếm khách duy nhất / đang online. Không chặn UI, nuốt mọi lỗi.
 */
export const trackVisit = (path) => {
  const sessionId = getOrCreateGuestSessionId();
  return axios
    .post('/api/analytics/visit', {path}, {headers: guestHeaders(sessionId)})
    .catch(() => {});
};
