# FE: Vite + react-router → Next.js App Router

**Đã xong.** react-router-dom đã gỡ khỏi dependencies. Mỗi URL giờ là một file `page.tsx`, điều
hướng do Next lo, 404 là HTTP 404 thật chứ không phải trang JS vẽ ra.

Phiên bản: **Next 14.2 + React 18** — cố tình không lên Next 15/React 19 vì `react-quill@2` còn
dùng `findDOMNode`, API đã bị xoá ở React 19.

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

```
src/app/
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

`src/spa/` (App.js + routes/) đã xoá.

## Bảng đối chiếu API

| react-router | Next |
|---|---|
| `useNavigate()` → `navigate(x)` | `useRouter()` → `router.push(x)` |
| `navigate(x, {replace:true})` | `router.replace(x)` |
| `navigate(-1)` | `router.back()` |
| `useLocation().pathname` | `usePathname()` |
| `<Link to=>` / `<NavLink>` | `<Link href=>` (`next/link`), trạng thái active tự so `usePathname()` |
| `<Navigate to replace/>` | `router.replace()` trong `useEffect` |
| `useSearchParams()` (đọc + ghi) | `useSearchParams()` chỉ đọc → dùng `~/shared/hooks/useSearchParamsState` |
| `<ProtectedRoute>` | `~/shared/ui/AuthGuard` đặt trong layout của nhóm |

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

61 file component cũ được đánh dấu `'use client'`. Đó là điều bình thường với một SPA chuyển sang
Next: chúng chạy ở client như trước, chỉ có `page.tsx`/`layout.tsx` là server component — vừa đủ
để khai `metadata`.

## SEO

- `layout.tsx`: `lang="vi"`, title/description/OG/Twitter dùng chung.
- `/posts/[postId]`: **`generateMetadata()` fetch bài từ API ngay trên server**, nên Zalo/Facebook
  bóc link mới hiện đúng tiêu đề và ảnh — đây là thứ SPA không bao giờ làm được, và là lý do
  chính đáng nhất để đổi sang Next.
- `/robots.txt` và `/sitemap.xml` sinh từ `robots.ts` / `sitemap.ts`.

## TypeScript

`allowJs: true`, `tsconfig.json` cố ý **không** include `**/*.js` — 528 file cũ chạy nguyên, không
bị type-check. File mới viết `.tsx`/`.ts` là được check ngay. Toàn bộ `src/app/**` đã là `.tsx`.

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

**Vặt:** `next/image` thay `<img>`; `loading.tsx` cho từng nhóm route; dọn override Bootstrap
trong `shared/styles/global-overrides.scss`; `REORG-PLAN.md` còn nhắc `index.html`/`vite.config`
đã bị xoá.
