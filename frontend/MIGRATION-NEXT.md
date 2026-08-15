# FE: Vite + react-router → Next.js App Router

**Đã xong.** react-router-dom đã gỡ khỏi dependencies. Mỗi URL giờ là một file `page.tsx`, điều
hướng do Next lo, 404 là HTTP 404 thật chứ không phải trang JS vẽ ra.

Phiên bản: **Next 16.3 + React 19.2** — ngang với `edusoft-lms`. `react-quill` (thứ chặn đường vì
dùng `findDOMNode`) đã được thay bằng `app/components/RichTextEditor` dựng trên `quill@2`.

Build chạy bằng **Turbopack** (mặc định của Next 16). Vì vậy `next.config.mjs` **không được** khai
`webpack:` — Next 16 sẽ báo lỗi build. Alias `@/` do `paths` trong `tsconfig.json` lo, và
`sassOptions` phải dùng `loadPaths` (tên của Sass API hiện đại) chứ `includePaths` không còn tác
dụng với Turbopack.

## Chạy

```bash
pnpm dev        # http://localhost:3000
pnpm build
pnpm start
pnpm typecheck
```

Biến môi trường đổi tiền tố `VITE_` → `NEXT_PUBLIC_`. Thêm `NEXT_PUBLIC_SITE_URL` — gốc của thẻ
OG, sitemap và robots, **phải đổi sang domain thật khi deploy**.

## Cấu trúc

> Cấu trúc thư mục đầy đủ (sau đợt tái cấu trúc theo chuẩn edusoft-lms) nằm ở
> [ARCHITECTURE.md](ARCHITECTURE.md). Phần dưới chỉ liệt kê các nhóm route.

```
app/
  layout.tsx              <html lang="vi">, metadata/OG mặc định, nạp CSS global
  providers.tsx           'use client' — QueryClient, Auth, Streak, Coin, Cosmetic, Toast
  not-found.tsx           404 thật của Next
  robots.ts, sitemap.ts   sinh /robots.txt và /sitemap.xml
  (public)/               13 trang công khai — DefaultLayout, không cần đăng nhập
  (user)/                 25 trang phải đăng nhập
  (user-focus)/           3 trang chế độ tập trung (ẩn Footer + nút cuộn)
  (guest)/ (guest-focus)/ (guest-exam)/   luồng làm bài, khách chưa đăng nhập vẫn vào được
  (admin)/                27 trang quản trị, kiểm quyền theo pathname
  (bare)/                 trang in tài liệu + /not-found (không khung)
```

Thư mục trong ngoặc là **route group** — không xuất hiện trong URL, chỉ để nhóm các trang dùng
chung một layout/lớp bảo vệ. Nhờ vậy `/admin/dashboard` (nhóm `(admin)`, cần quyền) và
`/admin/create-test-from-bank` (nhóm `(user)`, chỉ cần đăng nhập) cùng nằm dưới `/admin` mà vẫn
áp hai lớp bảo vệ khác nhau — điều mà bảng route phẳng cũ không diễn đạt nổi.

`src/spa/` (App.js + routes/) đã xoá. Bản thân thư mục `src/` cũng không còn — xem
[ARCHITECTURE.md](ARCHITECTURE.md).

## Bảng đối chiếu API

| react-router | Next |
|---|---|
| `useNavigate()` → `navigate(x)` | `useRouter()` → `router.push(x)` |
| `navigate(x, {replace:true})` | `router.replace(x)` |
| `navigate(-1)` | `router.back()` |
| `useLocation().pathname` | `usePathname()` |
| `<Link to=>` / `<NavLink>` | `<Link href=>` (`next/link`), trạng thái active tự so `usePathname()` |
| `<Navigate to replace/>` | `router.replace()` trong `useEffect` |
| `useSearchParams()` (đọc + ghi) | `useSearchParams()` chỉ đọc → dùng `@/app/hooks/useSearchParamsState` |
| `<ProtectedRoute>` | `@/app/components/AuthGuard` đặt trong layout của nhóm |

**`location.state` không có bản tương đương** — Next không mang state qua điều hướng. 5 chỗ đang
dùng đã chuyển sang query string, giao ước mới:

- `?mode=signin|signup` — mở trang đăng nhập ở tab nào
- `?from=/duong-dan` — quay lại đâu sau khi đăng nhập (`getRedirectTarget` **chỉ nhận đường dẫn
  nội bộ**, chặn `?from=https://…` dắt người dùng ra ngoài)
- `?flash=<thông báo>` — thông báo hiện ở trang đăng nhập

Một chỗ mất dữ liệu mà **không sao**: `state: {allowedTime}` truyền từ TestCard sang trang làm bài
vốn chẳng ai đọc — đã bỏ hẳn.

## Những thứ SSR bắt lỗi mà SPA giấu được

Vite chỉ chạy code trong trình duyệt; Next render trước ở server nên loạt vấn đề tiềm ẩn lộ ra:

- **Quill chạm `document` ngay khi nạp module** → chuyển sang `next/dynamic` với `ssr: false` ở
  CreatePostModal và EmailEditorModal.
- **`createPortal(..., document.body)` lúc render** (BaseModal, ConfirmModal, MobileBottomNav) →
  gate bằng hook `useMounted`.
- **`<Link href={undefined}>`** vì `routes.register` không tồn tại trong bảng route, và một link
  trỏ `/forgot-password` trong khi route thật là `/forgot`. Hai link hỏng có sẵn từ trước, SPA
  nuốt im còn Next thì nổ khi build.
- **Trang admin có tham số động** (`/admin/exam-types/:id/layout`) tra bảng quyền bằng pathname
  thật sẽ trượt ⇒ mất lớp kiểm quyền. Đã thêm `findAdminPermission()` so khớp theo mẫu.
- **`useSearchParams()` phải nằm trong `<Suspense>`** — mỗi layout nhóm đều có sẵn.

Phần lớn component được đánh dấu `'use client'`. Đó là điều bình thường với một SPA chuyển sang
Next: chúng chạy ở client như trước, chỉ có `page.tsx`/`layout.tsx` là server component — vừa đủ
để khai `metadata`.

## SEO

- `layout.tsx`: `lang="vi"`, title/description/OG/Twitter dùng chung.
- `/posts/[postId]`: **`generateMetadata()` fetch bài từ API ngay trên server**, nên Zalo/Facebook
  bóc link mới hiện đúng tiêu đề và ảnh — đây là thứ SPA không bao giờ làm được, và là lý do
  chính đáng nhất để đổi sang Next.
- `/robots.txt` và `/sitemap.xml` sinh từ `robots.ts` / `sitemap.ts`.

## TypeScript

**Toàn bộ FE đã là TypeScript** — không còn file `.js` nào trong `app/`. Kiểu dữ liệu API lấy từ
`app/types/` (mirror DTO backend) và `app/enums/`, mọi hàm trong `app/apis/` khai `Promise<T>`
tường minh. `allowJs` vẫn bật nhưng không còn tác dụng thực tế.

Việc chuyển kiểu đã làm lộ và vá **7 lỗi có sẵn** mà JavaScript nuốt im: thiếu `import routes`
ở trang đăng nhập, thiếu `import useSearchParamsState` ở 2 trang, và 4 chỗ còn destructure
`const [searchParams] = useSearchParams()` theo kiểu react-router (Next trả thẳng object nên
`.get()` không chạy — trang reset mật khẩu không đọc được token).

## Việc còn lại

**Ưu tiên 1 — test tay. Chưa bấm thử luồng nào**; build xanh chỉ chứng minh code hợp lệ. Cần đi
hết: đăng nhập thường + Google, chuyển hướng sau đăng nhập (`?from=`), làm bài có giờ → nộp → xem
kết quả → xem lại, luồng khách chưa đăng nhập, in chứng chỉ, mở modal ở trang Album/admin, soạn
bài bằng Quill, và một vai trò không phải ADMIN vào khu quản trị.

**Ưu tiên 2 — chặn quyền ở server.** `AuthGuard` chạy ở client vì token nằm trong AuthContext:
HTML của trang riêng tư vẫn được gửi về trước rồi mới chuyển hướng. Muốn chặn từ server thì phải
đổi sang cookie httpOnly và kiểm trong `middleware.ts`. Chưa làm.

**Ưu tiên 3 — dùng server component để lấy dữ liệu.** Hiện toàn bộ vẫn là React Query phía client;
đúng chuẩn Next, nhưng chưa tận dụng được điểm mạnh nhất của App Router. Bắt đầu từ trang danh
sách bài viết và trang chủ.

**Vặt:** `next/image` thay `<img>`; `generateMetadata` cho các trang chi tiết còn thiếu (loại đề,
tra cứu chứng chỉ); dọn override Bootstrap trong `app/assets/styles/global-overrides.scss`.

## Bẫy của Next 16 đã vấp (ghi lại để khỏi vấp lại)

**`params` là Promise.** Từ Next 15 `params`/`searchParams`/`cookies()`/`headers()` là bất đồng bộ,
Next 16 bỏ hẳn cách truy cập đồng bộ. Trang `/posts/[postId]` tự khai kiểu `params` bằng tay nên
TypeScript không phát hiện thiếu `await` — `generateMetadata` âm thầm rơi vào nhánh trả `{}`, mất
sạch thẻ OG riêng của từng bài. Cách tránh: **luôn dùng `PageProps<'/route'>`** do `next typegen`
sinh, đừng tự khai kiểu params.

**Đừng tin `pnpm start` đang chạy là bản mới.** Nếu cổng 3000 còn tiến trình cũ, `next start` báo
`EADDRINUSE` rồi thoát, và trình duyệt vẫn nhận HTML của bản build cũ — rất dễ kết luận nhầm là
bản sửa không có tác dụng.
