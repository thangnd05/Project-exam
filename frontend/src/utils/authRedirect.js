import { queryClient } from '~/config/queryClient';
import { claimGuestTests } from '~/api/userTestApi';
import { getGuestSessionId, clearGuestSessionId } from '~/utils/guestSession';

// Key sessionStorage giữ đường dẫn cần quay lại sau login qua OAuth (Google/Facebook).
// OAuth redirect ra ngoài trang -> mất location.state của React Router, nên phải
// tự lưu đích trước khi rời trang rồi đọc lại ở OAuth2Redirect.
const OAUTH_REDIRECT_KEY = 'postLoginRedirect';

// Tính đường dẫn quay lại sau khi đăng nhập, GIỮ nguyên cả query string
// (vd ?mode=practice&parts=... của trang làm bài) — chỉ dùng pathname sẽ mất param.
export const getRedirectTarget = (location, fallback = '/') => {
  const from = location?.state?.from;
  if (from && from.pathname) {
    return `${from.pathname}${from.search || ''}${from.hash || ''}`;
  }
  return fallback;
};

// Lưu đích quay lại trước khi điều hướng ra trang OAuth của nhà cung cấp.
export const saveOAuthRedirect = (target) => {
  if (typeof window === 'undefined' || !target || target === '/') return;
  window.sessionStorage.setItem(OAUTH_REDIRECT_KEY, target);
};

// Đọc & xoá đích quay lại sau khi OAuth trả về.
export const takeOAuthRedirect = (fallback = '/') => {
  if (typeof window === 'undefined') return fallback;
  const target = window.sessionStorage.getItem(OAUTH_REDIRECT_KEY);
  window.sessionStorage.removeItem(OAUTH_REDIRECT_KEY);
  return target || fallback;
};

// Gắn bài làm của phiên guest vào tài khoản vừa đăng nhập.
// Non-blocking về mặt trải nghiệm: lỗi ở đây không được chặn luồng login.
export const claimGuestAfterLogin = async () => {
  const guestSessionId = getGuestSessionId();
  if (!guestSessionId) return 0;
  try {
    const res = await claimGuestTests(guestSessionId);
    clearGuestSessionId();
    // Làm mới lịch sử / danh sách bài đã làm để phản ánh các attempt vừa gắn.
    queryClient.invalidateQueries();
    return res?.claimed || 0;
  } catch (err) {
    // Không chặn login nếu claim lỗi — bài guest vẫn còn theo guestSessionId.
    console.error('Claim guest tests failed:', err);
    return 0;
  }
};
