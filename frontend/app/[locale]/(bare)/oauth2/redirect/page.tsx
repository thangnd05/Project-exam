import { PRIVATE_ROBOTS } from '@/app/i18n/metadata';
import OAuth2Redirect from './OAuth2Redirect';

// Trang trung gian sau OAuth: nằm ngoài AuthGuard vì lúc tới đây phiên đăng nhập có thể chưa (hoặc không) có,
// trang tự xử lý cả thành công lẫn thất bại.
export const metadata = { robots: PRIVATE_ROBOTS, description: null };

export default function Page() {
  return <OAuth2Redirect />;
}
