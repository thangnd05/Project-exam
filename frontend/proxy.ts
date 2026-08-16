import { NextResponse, type NextRequest } from 'next/server';

/**
 * Chặn ở tầng server các trang bắt buộc đăng nhập.
 *
 * Next 16 đổi tên quy ước `middleware.ts` thành `proxy.ts` (middleware.ts vẫn chạy nhưng
 * đã deprecated), hàm export tên `proxy`.
 *
 * Chạy được là nhờ proxy trong next.config.mjs: browser gọi /api trên chính domain FE nên
 * cookie `accessToken` (HttpOnly, do Spring set) thuộc về domain FE và middleware đọc được.
 * Nếu bỏ proxy mà gọi thẳng backend thì cookie rơi vào domain khác, middleware sẽ không
 * thấy gì — lúc đó phải tắt file này, đừng để nó đá nhầm người đang đăng nhập ra ngoài.
 *
 * Đây chỉ là lớp lọc thô "có phiên hay chưa" để bỏ cú nháy spinner của AuthGuard.
 * Việc xác thực chữ ký token và kiểm tra quyền chi tiết vẫn do backend + AuthGuard làm.
 */

const AUTH_COOKIE = 'accessToken';

// Đường dẫn công khai nằm lọt bên trong một prefix cần đăng nhập.
// /certificates/[certificateId] cần đăng nhập, nhưng /certificates/verify thì không —
// đó là trang tra cứu chứng chỉ dành cho nhà tuyển dụng.
const PUBLIC_EXCEPTIONS = ['/certificates/verify'];

const isPublicException = (pathname: string) =>
  PUBLIC_EXCEPTIONS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicException(pathname)) return NextResponse.next();
  if (request.cookies.has(AUTH_COOKIE)) return NextResponse.next();

  // Giữ nguyên giao kèo với trang login như AuthGuard vẫn làm: `from` để quay lại chỗ cũ,
  // `flash` để hiện thông báo. Kèm cả query string của trang đang bị chặn.
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', `${pathname}${search}`);
  loginUrl.searchParams.set('flash', 'Bạn cần đăng nhập để truy cập trang này!');

  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Chỉ các nhóm route (user), (user-focus), (admin). Cố tình bỏ /oauth2/redirect: trang đó
  // chạy ngay sau khi backend set cookie, chặn ở đây dễ tạo vòng lặp chuyển hướng.
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
