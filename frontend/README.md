# english_exam_fe

Next.js 16 (App Router) + React 19, TypeScript, pnpm. Cấu trúc thư mục: [ARCHITECTURE.md](ARCHITECTURE.md),
bảng URL: [URL-MAP.md](URL-MAP.md).

## Chạy

```bash
pnpm dev        # http://localhost:3000
pnpm build
pnpm start
pnpm typecheck
pnpm lint
```

Biến môi trường xem `.env.example`. `NEXT_PUBLIC_SITE_URL` là gốc của thẻ OG, sitemap và robots,
**phải đổi sang domain thật khi deploy**.

## Quy ước query string khi điều hướng

Next không mang state qua điều hướng (không có `location.state`), nên dùng query string:

- `?mode=signin|signup` - mở trang đăng nhập ở tab nào
- `?from=/duong-dan` - quay lại đâu sau khi đăng nhập (`getRedirectTarget` **chỉ nhận đường dẫn
  nội bộ**, chặn `?from=https://…` dắt người dùng ra ngoài)
- `?flash=<thông báo>` - thông báo hiện ở trang đăng nhập

## Bẫy của Next 16 đã vấp

- **`next.config.mjs` không được khai `webpack:`** khi build bằng Turbopack (mặc định của Next 16).
  Alias `@/` do `paths` trong `tsconfig.json` lo; `sassOptions` dùng `loadPaths`.
- **`params` là Promise.** `params`/`searchParams`/`cookies()`/`headers()` đều bất đồng bộ. Tự khai
  kiểu `params` bằng tay thì TypeScript không bắt được chỗ thiếu `await` (từng làm `generateMetadata`
  của `/posts/[postId]` âm thầm trả `{}`). **Luôn dùng `PageProps<'/route'>`** do `next typegen` sinh.
- **Code chạm `document`/`window` lúc render** (Quill, `createPortal(..., document.body)`) phải đi qua
  `next/dynamic` với `ssr: false` hoặc gate bằng `useMounted`.
- **`useSearchParams()` phải nằm trong `<Suspense>`** - mỗi layout nhóm đều có sẵn.
- **Đừng tin `pnpm start` đang chạy là bản mới.** Nếu cổng 3000 còn tiến trình cũ, `next start` báo
  `EADDRINUSE` rồi thoát, và trình duyệt vẫn nhận HTML của bản build cũ.
