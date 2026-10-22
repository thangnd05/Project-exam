import { queryClient } from '@/app/configs/queryClient';
import { claimGuestTests } from '@/app/apis/userTestApi';
import { getGuestSessionId, clearGuestSessionId, setGuestClaimIntent, takeGuestClaimIntent } from '@/app/utils/guestSession';
import { localizeHref, splitLocale } from '@/app/i18n/routing';

const OAUTH_REDIRECT_KEY = 'postLoginRedirect';

type SearchParamsLike = { get(name: string): string | null };

const AUTH_PAGES = ['/login', '/forgot', '/reset'];
const PROBE_ORIGIN = 'https://internal.invalid';

const isInternalPath = (target: string): boolean => {
  if (!target.startsWith('/') || target.startsWith('//')) return false;
  if (/[\\\u0000-\u001f\u007f]/.test(target)) return false;
  try {
    return new URL(target, PROBE_ORIGIN).origin === PROBE_ORIGIN;
  } catch {
    return false;
  }
};

const isSafeRedirect = (target: string | null | undefined): target is string =>
  typeof target === 'string'
  && isInternalPath(target)
  && !AUTH_PAGES.some((p) => {
    const bare = splitLocale(target.split('?')[0]).pathname;
    return bare === p || bare.startsWith(`${p}/`);
  });

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

// Đăng nhập xong quay lại đúng trang đang đứng thay vì rơi về trang chủ. Kết quả dùng cho
// window.location (không qua router của app/i18n) nên tự gắn ngôn ngữ của trang hiện tại.
export const buildLoginUrlFromHere = (flash?: string): string => {
  if (typeof window === 'undefined') return buildLoginUrl(null, { flash });
  const { locale, pathname } = splitLocale(window.location.pathname);
  return localizeHref(buildLoginUrl(pathname + window.location.search, { flash }), locale);
};

export const saveOAuthRedirect = (target: string | null | undefined): void => {
  if (typeof window === 'undefined' || !target || target === '/') return;
  window.sessionStorage.setItem(OAUTH_REDIRECT_KEY, target);
};

export const takeOAuthRedirect = (fallback = '/'): string => {
  if (typeof window === 'undefined') return fallback;
  const target = window.sessionStorage.getItem(OAUTH_REDIRECT_KEY);
  window.sessionStorage.removeItem(OAUTH_REDIRECT_KEY);
  return isSafeRedirect(target) ? target : fallback;
};

// Chỉ gắn bài khi khách đã bấm "Đăng nhập & lưu". Đăng nhập theo đường khác thì bỏ phiên khách,
// bài vẫn nằm trong database dạng khách (userId = null).
export const claimGuestAfterLogin = async (): Promise<number> => {
  const guestSessionId = getGuestSessionId();
  const userTestId = takeGuestClaimIntent();
  if (!guestSessionId) return 0;
  if (!userTestId) {
    clearGuestSessionId();
    return 0;
  }
  try {
    const res = await claimGuestTests(guestSessionId, userTestId);
    clearGuestSessionId();

    queryClient.invalidateQueries();
    return res?.claimed || 0;
  } catch (err) {
    // Lỗi mạng thì giữ lại ý định lưu để lần đăng nhập sau gắn tiếp.
    setGuestClaimIntent(userTestId);
    console.error('Claim guest tests failed:', err);
    return 0;
  }
};
