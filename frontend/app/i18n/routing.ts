import { defineRouting } from 'next-intl/routing';

// Tiếng Việt là mặc định và không có tiền tố (/exams), tiếng Anh nằm dưới /en (/en/exams).
// Ngôn ngữ chỉ lấy từ URL: không đoán theo Accept-Language hay cookie, để người Việt dùng trình duyệt
// tiếng Anh không bị đẩy sang /en, và mỗi URL luôn ra đúng một bản cho bộ máy tìm kiếm.
export const routing = defineRouting({
  locales: ['vi', 'en'],
  defaultLocale: 'vi',
  localePrefix: 'as-needed',
  localeDetection: false,
  localeCookie: false,
  // hreflang đặt trong metadata của từng trang công khai; header Link tự sinh sẽ quảng bá cả trang cần đăng nhập.
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
};

// Đường dẫn được rewrite sang backend (next.config.mjs) hoặc là tệp tĩnh: không phải trang, không gắn tiền tố.
const NON_PAGE_PREFIXES = ['/api/', '/oauth2/authorization/', '/login/oauth2/', '/_next/'];
const FILE_EXTENSION = /\.[a-z0-9]+$/i;

export function isPagePath(pathname: string): boolean {
  if (NON_PAGE_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return !FILE_EXTENSION.test(pathname);
}

// '/en/exams' -> { locale: 'en', pathname: '/exams' }; '/exams' -> locale mặc định.
export function splitLocale(pathname: string): { locale: Locale; pathname: string } {
  const [, first, ...rest] = pathname.split('/');
  const locale = routing.locales.find((l) => l === first);
  if (!locale) return { locale: routing.defaultLocale, pathname };
  return { locale, pathname: `/${rest.join('/')}` };
}

// Thêm tiền tố ngôn ngữ cho link nội bộ. Link ngoài, mailto, đường dẫn backend và href đã có tiền tố
// giữ nguyên, nên bọc nhiều lớp (Link/router của app/i18n + localizeHref thủ công) cũng không ra /en/en.
export function localizeHref(href: string, locale: string): string {
  if (locale === routing.defaultLocale || !href.startsWith('/') || href.startsWith('//')) return href;
  const pathname = href.split(/[?#]/)[0];
  if (!isPagePath(pathname) || splitLocale(pathname).pathname !== pathname) return href;
  return pathname === '/' ? `/${locale}${href.slice(1)}` : `/${locale}${href}`;
}
