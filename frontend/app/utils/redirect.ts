import routes from '@/app/configs/Routes';
import { localizeHref, splitLocale } from '@/app/i18n/routing';

// Một chỗ cho mọi luồng "đi đăng nhập rồi quay lại": dựng link /login kèm trang cần quay về (?from=),
// đọc lại đích sau khi đăng nhập / OAuth và chặn đích trỏ ra ngoài site (open redirect).
// Không phụ thuộc React hay API nên proxy.ts dùng chung được; phần đụng window đều kiểm tra trước.

export const REDIRECT_PARAM = 'from';
const OAUTH_REDIRECT_KEY = 'postLoginRedirect';
const AUTH_PAGES: string[] = [routes.login, routes.forgot, routes.reset];
const PROBE_ORIGIN = 'https://internal.invalid';

type SearchParamsLike = { get(name: string): string | null };

type LoginUrlOptions = {
  mode?: 'signin' | 'signup';
  // Lời nhắc hiện trên trang đăng nhập ("Đăng nhập để...").
  flash?: string;
};

const matchesPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

// Trang đăng nhập / quên / đặt lại mật khẩu, có hoặc không có tiền tố ngôn ngữ.
export const isAuthPage = (pathname: string): boolean => {
  const bare = splitLocale(pathname.split(/[?#]/)[0]).pathname;
  return AUTH_PAGES.some((p) => matchesPrefix(bare, p));
};

const isInternalPath = (target: string): boolean => {
  if (!target.startsWith('/') || target.startsWith('//')) return false;
  if (/[\\\u0000-\u001f\u007f]/.test(target)) return false;
  try {
    return new URL(target, PROBE_ORIGIN).origin === PROBE_ORIGIN;
  } catch {
    return false;
  }
};

// Đích hợp lệ: đường dẫn nội bộ và không quay lại chính trang đăng nhập (tránh vòng lặp).
export const isSafeRedirect = (target: string | null | undefined): target is string =>
  typeof target === 'string' && isInternalPath(target) && !isAuthPage(target);

export const safeRedirect = (target: string | null | undefined, fallback = '/'): string =>
  isSafeRedirect(target) ? target : fallback;

export const getRedirectTarget = (searchParams: SearchParamsLike | null | undefined, fallback = '/'): string =>
  safeRedirect(searchParams?.get?.(REDIRECT_PARAM), fallback);

// Trả về đường dẫn chưa gắn ngôn ngữ: router/Link của app/i18n tự gắn, chỗ khác thì bọc localizeHref.
export const buildLoginUrl = (from?: string | null, options: LoginUrlOptions = {}): string => {
  const params = new URLSearchParams();
  if (options.mode) params.set('mode', options.mode);
  if (isSafeRedirect(from)) params.set(REDIRECT_PARAM, from);
  if (options.flash) params.set('flash', options.flash);
  const qs = params.toString();
  return qs ? `${routes.login}?${qs}` : routes.login;
};

export const buildGuestSignupUrl = (from: string): string => buildLoginUrl(from, { mode: 'signup' });

// Đăng nhập xong quay lại đúng trang đang đứng (kèm query). Đã gắn ngôn ngữ của trang hiện tại
// nên dùng được cả với window.location lẫn router của app/i18n (localizeHref không gắn hai lần).
export const buildLoginUrlFromHere = (flash?: string): string => {
  if (typeof window === 'undefined') return buildLoginUrl(null, { flash });
  const { locale, pathname } = splitLocale(window.location.pathname);
  return localizeHref(buildLoginUrl(pathname + window.location.search, { flash }), locale);
};

// Backend OAuth luôn trả về /oauth2/redirect (không tiền tố ngôn ngữ), nên lưu sẵn đích trước khi rời trang.
export const saveOAuthRedirect = (target: string | null | undefined): void => {
  if (typeof window === 'undefined' || !target || target === '/') return;
  try {
    window.sessionStorage.setItem(OAUTH_REDIRECT_KEY, target);
  } catch {
    // Trình duyệt chặn storage thì đăng nhập xong về trang chủ.
  }
};

export const takeOAuthRedirect = (fallback = '/'): string => {
  if (typeof window === 'undefined') return fallback;
  try {
    const target = window.sessionStorage.getItem(OAUTH_REDIRECT_KEY);
    window.sessionStorage.removeItem(OAUTH_REDIRECT_KEY);
    return safeRedirect(target, fallback);
  } catch {
    return fallback;
  }
};
