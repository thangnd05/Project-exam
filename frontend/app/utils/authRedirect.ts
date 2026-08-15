import { queryClient } from '@/app/configs/queryClient';
import { claimGuestTests } from '@/app/apis/userTestApi';
import { getGuestSessionId, clearGuestSessionId } from '@/app/utils/guestSession';

const OAUTH_REDIRECT_KEY = 'postLoginRedirect';

/** Nhận cả URLSearchParams lẫn ReadonlyURLSearchParams của Next. */
type SearchParamsLike = { get(name: string): string | null };

/**
 * Nơi cần quay lại sau khi đăng nhập.
 *
 * Bản react-router cũ nhận cả object `location` rồi đọc `location.state.from`. Next không có
 * location.state nên giao ước đổi thành query `?from=`; hàm này giờ nhận URLSearchParams
 * (kết quả của useSearchParams). Chỉ chấp nhận đường dẫn nội bộ bắt đầu bằng '/' để không ai
 * dựng được link `?from=https://...` đưa người dùng ra ngoài sau khi đăng nhập.
 */
export const getRedirectTarget = (searchParams: SearchParamsLike | null | undefined, fallback = '/'): string => {
  const from = searchParams?.get?.('from');
  if (from && from.startsWith('/') && !from.startsWith('//')) return from;
  return fallback;
};

export const saveOAuthRedirect = (target: string | null | undefined): void => {
  if (typeof window === 'undefined' || !target || target === '/') return;
  window.sessionStorage.setItem(OAUTH_REDIRECT_KEY, target);
};

export const takeOAuthRedirect = (fallback = '/'): string => {
  if (typeof window === 'undefined') return fallback;
  const target = window.sessionStorage.getItem(OAUTH_REDIRECT_KEY);
  window.sessionStorage.removeItem(OAUTH_REDIRECT_KEY);
  return target || fallback;
};

export const claimGuestAfterLogin = async (): Promise<number> => {
  const guestSessionId = getGuestSessionId();
  if (!guestSessionId) return 0;
  try {
    const res = await claimGuestTests(guestSessionId);
    clearGuestSessionId();

    queryClient.invalidateQueries();
    return res?.claimed || 0;
  } catch (err) {

    console.error('Claim guest tests failed:', err);
    return 0;
  }
};
