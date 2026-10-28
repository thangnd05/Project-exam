import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { localizeHref, routing, splitLocale } from '@/app/i18n/routing';
import { buildLoginUrl } from '@/app/utils/redirect';

const AUTH_COOKIE = 'accessToken';
// Access token chỉ sống 15 phút; còn cookie này (sống bằng refresh token) nghĩa là client tự refresh được.
const SESSION_HINT_COOKIE = 'hasSession';

// Trang cần đăng nhập (gồm cả trang con). Trang cá nhân (mục tiêu, lộ trình, lịch sử thi thử, chứng chỉ)
// nằm hết dưới /dashboard; URL cũ đã được next.config chuyển sang trước khi tới đây.
// Trang khách xem được, bấm thao tác mới bắt đăng nhập (/learning-paths, /learning-paths/create, /goals/new,
// làm bài, kết quả) nằm ngoài các tiền tố này.
const PROTECTED_PREFIXES = [
  '/admin',
  '/albums',
  '/class',
  '/classes',
  '/dashboard',
  '/my-albums',
  '/my-classes',
  '/practice',
];

const matchesPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

const isProtected = (pathname: string) => PROTECTED_PREFIXES.some((p) => matchesPrefix(pathname, p));

// Thông báo hiện trên trang đăng nhập (query `flash`), theo ngôn ngữ của trang người dùng vừa mở.
const LOGIN_REQUIRED_FLASH: Record<string, string> = {
  vi: 'Bạn cần đăng nhập để truy cập trang này!',
  en: 'Please log in to access this page!',
};

const API_ORIGIN = (process.env.API_ORIGIN ?? '').replace(/\/$/, '');
const LEGACY_EXAM_PATH =
  /^\/exams\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(\/collections\/[^/]+)?\/?$/i;

// Link cũ /exams/<uuid> (/exam-types/<uuid> đã được next.config đổi sang /exams trước): tra slug rồi trả 308 thật.
// Không làm trong page được vì (public) có loading.tsx, khung trang đã gửi mã 200 trước nên redirect() ở page
// chỉ còn là chuyển trang phía trình duyệt.
async function redirectLegacyExamPath(request: NextRequest, pathname: string, prefix: string) {
  const match = pathname.match(LEGACY_EXAM_PATH);
  if (!match || !API_ORIGIN) return null;
  try {
    const res = await fetch(`${API_ORIGIN}/api/exam-types/${match[1]}`);
    if (!res.ok) return null;
    const exam = (await res.json()) as { slug?: string; parentSlug?: string };
    if (!exam?.slug) return null;
    const slugPath = exam.parentSlug ? `${exam.parentSlug}/${exam.slug}` : exam.slug;
    const url = request.nextUrl.clone();
    url.pathname = `${prefix}/exams/${slugPath}${match[2] ?? ''}`;
    return NextResponse.redirect(url, 308);
  } catch {
    return null;
  }
}

// Ghép URL không tiền tố thành /vi/... ở nội bộ (route nằm trong app/[locale]) và bỏ /vi thừa trên URL.
const handleI18n = createIntlMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { search } = request.nextUrl;
  const { locale, pathname } = splitLocale(request.nextUrl.pathname);
  const isDefaultLocale = locale === routing.defaultLocale;

  // Trang kỳ thi công khai: chỉ đổi link cũ sang slug, không bắt đăng nhập.
  if (matchesPrefix(pathname, '/exams')) {
    const prefix = isDefaultLocale ? '' : `/${locale}`;
    return (await redirectLegacyExamPath(request, pathname, prefix)) ?? handleI18n(request);
  }

  const hasSession = request.cookies.has(AUTH_COOKIE) || request.cookies.has(SESSION_HINT_COOKIE);
  if (isProtected(pathname) && !hasSession) {
    const loginPath = buildLoginUrl(`${pathname}${search}`, { flash: LOGIN_REQUIRED_FLASH[locale] });
    return NextResponse.redirect(new URL(localizeHref(loginPath, locale), request.url));
  }

  return handleI18n(request);
}

export const config = {
  // Mọi trang đều phải qua proxy để được ghép ngôn ngữ. Bỏ qua API/OAuth (rewrite sang backend),
  // tài nguyên của Next và tệp tĩnh (có đuôi, vd robots.txt, sitemap.xml, favicon).
  matcher: ['/((?!api|_next|_vercel|oauth2/authorization|login/oauth2|.*\\..*).*)'],
};
