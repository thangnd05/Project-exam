import { queryClient } from '@/app/configs/queryClient';
import { claimGuestTests } from '@/app/apis/userTestApi';
import { getGuestSessionId, clearGuestSessionId } from '@/app/utils/guestSession';

const OAUTH_REDIRECT_KEY = 'postLoginRedirect';

type SearchParamsLike = { get(name: string): string | null };

// Chỉ nhận đường dẫn nội bộ, và bỏ qua các trang xác thực để không bị vòng lặp chuyển hướng.
const AUTH_PAGES = ['/login', '/forgot', '/reset'];
const isSafeRedirect = (target: string | null | undefined): target is string =>
  Boolean(target)
  && target!.startsWith('/')
  && !target!.startsWith('//')
  && !AUTH_PAGES.some((p) => target === p || target!.startsWith(`${p}?`) || target!.startsWith(`${p}/`));

export const getRedirectTarget = (searchParams: SearchParamsLike | null | undefined, fallback = '/'): string => {
  const from = searchParams?.get?.('from');
  return isSafeRedirect(from) ? from : fallback;
};

export const buildLoginUrl = (
  from?: string | null,
  options: { mode?: 'signin' | 'signup'; flash?: string } = {},
): string => {
  const params = new URLSearchParams();
  if (options.mode) params.set('mode', options.mode);
  if (isSafeRedirect(from)) params.set('from', from);
  if (options.flash) params.set('flash', options.flash);
  const qs = params.toString();
  return qs ? `/login?${qs}` : '/login';
};

export const buildGuestSignupUrl = (from: string): string =>
  buildLoginUrl(from, { mode: 'signup' });

// Đăng nhập xong quay lại đúng trang đang đứng thay vì rơi về trang chủ.
export const buildLoginUrlFromHere = (flash?: string): string =>
  buildLoginUrl(
    typeof window === 'undefined' ? null : window.location.pathname + window.location.search,
    { flash },
  );

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
