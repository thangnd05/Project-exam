import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE = 'accessToken';

const PUBLIC_EXCEPTIONS = ['/certificates/verify'];

const isPublicException = (pathname: string) =>
  PUBLIC_EXCEPTIONS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicException(pathname)) return NextResponse.next();
  if (request.cookies.has(AUTH_COOKIE)) return NextResponse.next();

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
    '/learning-plans/:path*',
    '/my-albums/:path*',
    '/my-certificates/:path*',
    '/my-classes/:path*',
    '/my-target/:path*',
    '/my-tests/:path*',
    '/practice/:path*',
    '/profile/:path*',
    '/tests/history/:path*',
    '/tests/leaderboard/:path*',
  ],
};
