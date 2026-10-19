import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE = 'accessToken';
// Access token chỉ sống 15 phút; còn cookie này (sống bằng refresh token) nghĩa là client tự refresh được.
const SESSION_HINT_COOKIE = 'hasSession';

const PUBLIC_EXCEPTIONS = ['/certificates/verify'];

// Chỉ mở đúng trang này (không gồm trang con), khách xem được, bấm thao tác mới bắt đăng nhập.
const PUBLIC_EXACT = ['/learning-plans', '/learning-plans/generate', '/my-target'];

const isPublicException = (pathname: string) =>
  PUBLIC_EXACT.includes(pathname.replace(/\/$/, '')) ||
  PUBLIC_EXCEPTIONS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const API_ORIGIN = (process.env.API_ORIGIN ?? '').replace(/\/$/, '');
const LEGACY_EXAM_PATH =
  /^\/exam-types\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(\/collections\/[^/]+)?\/?$/i;

// Link cũ /exam-types/<uuid>: tra slug rồi trả 308 thật. Không làm trong page được vì (public)
// có loading.tsx, khung trang đã gửi mã 200 trước nên redirect() ở page chỉ còn là chuyển trang phía trình duyệt.
async function redirectLegacyExamPath(request: NextRequest) {
  const match = request.nextUrl.pathname.match(LEGACY_EXAM_PATH);
  if (!match || !API_ORIGIN) return null;
  try {
    const res = await fetch(`${API_ORIGIN}/api/exam-types/${match[1]}`);
    if (!res.ok) return null;
    const exam = (await res.json()) as { slug?: string; parentSlug?: string };
    if (!exam?.slug) return null;
    const slugPath = exam.parentSlug ? `${exam.parentSlug}/${exam.slug}` : exam.slug;
    const url = request.nextUrl.clone();
    url.pathname = `/exam-types/${slugPath}${match[2] ?? ''}`;
    return NextResponse.redirect(url, 308);
  } catch {
    return null;
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Trang kỳ thi công khai: chỉ đổi link cũ sang slug, không bắt đăng nhập.
  if (pathname === '/exam-types' || pathname.startsWith('/exam-types/')) {
    return (await redirectLegacyExamPath(request)) ?? NextResponse.next();
  }

  if (isPublicException(pathname)) return NextResponse.next();
  if (request.cookies.has(AUTH_COOKIE) || request.cookies.has(SESSION_HINT_COOKIE)) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', `${pathname}${search}`);
  loginUrl.searchParams.set('flash', 'Bạn cần đăng nhập để truy cập trang này!');

  return NextResponse.redirect(loginUrl);
}

export const config = {

  matcher: [
    '/admin/:path*',
    '/albums/:path*',
    '/certificates/:path*',
    '/class/:path*',
    '/classes/:path*',
    '/exam-types/:path*',
    '/learning-plans/:path*',
    '/my-albums/:path*',
    '/my-certificates/:path*',
    '/my-classes/:path*',
    '/my-target/:path*',
    '/practice/:path*',
    '/dashboard/:path*',
    '/tests/history/:path*',
    '/tests/leaderboard/:path*',
  ],
};
