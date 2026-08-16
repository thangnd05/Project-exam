# Kiến trúc Frontend — Next.js App Router (chuẩn route-colocated)

> Cấu trúc theo đúng chuẩn của `edusoft-lms`: mọi thứ nằm trong `app/`, code của một
> trang sống ngay cạnh route của trang đó, chỉ thứ **dùng chung thật sự** mới lên tầng chia sẻ.

## 1. Nguyên tắc

Không còn thư mục `src/`, cũng không còn `features/`. Một màn hình = một thư mục route,
bên trong có đủ page + component + hook của riêng nó. Cần dùng lại ở nơi khác thì mới
nâng lên `app/components` / `app/hooks` / `app/utils`.

Thang bậc tái sử dụng: `_components/` của route → `app/components/` → (nếu sau này tách
package dùng chung nhiều app thì mới tính tiếp).

## 2. Cấu trúc thư mục

```
frontend/
  proxy.ts                      # chặn đăng nhập ở tầng server (Next 16 đổi tên middleware.ts)
  app/
    layout.tsx                  # root layout: <html>, next/font, metadata/OG, nạp CSS global
    providers.tsx               # QueryClient + Auth/Streak/Coin/Cosmetic + Toast
    global-error.tsx            # lưới an toàn khi chính root layout lỗi
    not-found.tsx  robots.ts  sitemap.ts
    (public)/ (user)/ (user-focus)/ (guest)/ (guest-exam)/ (guest-focus)/ (admin)/ (bare)/
                                # 8 nhóm route: khác nhau ở layout + guard, không đổi URL
                                # mỗi nhóm có layout.tsx + loading.tsx + error.tsx
    apis/                       # axiosClient + 40 *Api.ts (typed Promise<T>)
    assets/                     # ảnh + styles/ (GlobalStyles, mixins, global-overrides)
    components/                 # UI dùng chung ≥2 route
      layouts/                  #   DefaultLayout, AdminLayout, Header, Footer, ...
      admin/                    #   adminKit (AdminTable, StatCard, AdminTabs...) + widget analytics
      tests/  exam-layout/      #   thành phần đề thi & engine layout làm bài
      gamification/  learning-plans/  modal/  Button/  ...
    configs/                    # Routes.ts, permissions.ts, adminPermissions.ts, queryClient.ts
    contexts/                   # Auth/Coin/Cosmetic/Streak context
    enums/                      # enum mirror backend (QuestionType, TestStatus, ...)
    hooks/                      # hook dùng chung ≥2 route
    types/                      # interface mirror DTO backend, theo domain + index.ts barrel
    utils/                      # hàm thuần dùng chung
    constants/ helpers/ interfaces/   # placeholder theo chuẩn, dùng khi cần
  next.config.mjs  tsconfig.json  package.json
```

### Cấu trúc một route

```
<route>/
  page.tsx            # server component: metadata (nếu có) + render <TênMàn />
  TênMàn.tsx          # 'use client', PascalCase, KHÔNG hậu tố "Page"
  TênMàn.module.scss
  _components/        # component chỉ route này dùng (PascalCase)
  _hooks/             # hook chỉ route này dùng (use-*.ts)
  [id]/ create/ ...   # route con lặp lại đúng bộ trên
```

Tiền tố `_` khiến Next bỏ qua thư mục khi dựng route — nhờ vậy component nằm cạnh trang
mà không tự biến thành URL.

## 3. Quy ước

| Hạng mục | Quy ước |
|---|---|
| Ngôn ngữ | TypeScript toàn bộ (`.tsx` cho component, `.ts` cho hook/util/api) |
| Alias | `@/` trỏ gốc `frontend/` — luôn import `@/app/...` |
| `page.tsx` | Server component, không `'use client'`, chỉ render component chính |
| Component chính | `'use client'`, `export default`, tên trùng thư mục route, bỏ hậu tố `Page` |
| File `.ts` không phải component | camelCase như hiện có (`useTestSession.ts`, `planLabels.ts`) |
| Style | SCSS module cạnh component; cấm hex/rgba literal — dùng token trong GlobalStyles |
| Server state | TanStack Query, `queryFn` gọi hàm trong `app/apis/` |
| Kiểu dữ liệu API | lấy từ `@/app/types`, enum từ `@/app/enums` (mirror DTO backend) |

## 4. Tra nhanh: tìm code ở đâu

**Quy tắc một câu: URL trên trình duyệt chính là đường dẫn thư mục.** `/my-target/dashboard`
→ `app/(user)/my-target/dashboard/TargetDashboard.tsx`. Thư mục trong ngoặc không nằm trong URL,
khi mò thì bỏ qua nó. Nhanh nhất là `Ctrl+P` gõ tên màn hình — mỗi màn hình có đúng một file
mang tên nó, không còn hàng chục `index.js` trùng tên như cấu trúc cũ.

| Cần tìm | Vào đâu |
|---|---|
| Component/hook chỉ một trang dùng | `_components/`, `_hooks/` ngay trong thư mục trang |
| Component dùng ≥2 nơi | `app/components/` (xem `index.ts` để biết có sẵn những gì) |
| Hàm gọi API | `app/apis/<tên>Api.ts` |
| Kiểu dữ liệu backend trả về | `app/types/` |
| Màu, biến CSS | `app/assets/styles/GlobalStyles/` |

> **Bẫy hay nhầm nhất:** 27 trang quản trị nằm ở `(admin)/admin/*`, nhưng
> `/admin/create-test-from-bank` và `/admin/personal-question-bank` lại nằm ở
> **`(user)/admin/*`**. Hai trang này chỉ cần đăng nhập chứ không cần quyền admin, nên phải
> ở nhóm có guard khác — URL giống nhau nhưng lớp bảo vệ khác nhau. Tìm trong `(admin)` sẽ
> không thấy chúng.

## 5. Điểm cần biết

- **Browser không gọi thẳng backend.** `next.config.mjs` rewrite `/api/*`,
  `/oauth2/authorization/*`, `/login/oauth2/*` sang `API_ORIGIN`. Nhờ cùng origin, cookie
  `accessToken` (HttpOnly do Spring set) thuộc domain FE và không cần CORS. `axios` chạy với
  `baseURL` rỗng — đừng đặt lại `NEXT_PUBLIC_API_BASE_URL` trừ khi cố ý bỏ proxy.
  - Backend đi kèm: `google.redirect-uri=${app.frontend.origin}/login/oauth2/code/google`,
    và URI đó phải được khai trong Google Cloud Console.
- **Chặn đăng nhập hai lớp.** `proxy.ts` (tên mới của `middleware.ts` từ Next 16) chỉ xem có
  cookie `accessToken` hay không rồi đá về `/login?from=...`, bỏ được cú nháy spinner.
  `AuthGuard` vẫn giữ vì nó mới là chỗ kiểm quyền chi tiết (`requiredPermission`) và xử lý
  được trường hợp access token hết hạn nhưng refresh token còn sống.
  - Đổi/bổ sung route cần đăng nhập thì phải sửa `matcher` trong `proxy.ts`, nó không tự
    suy ra từ nhóm route.
- **`useSearchParams` bắt buộc nằm trong `<Suspense>`** — mỗi layout nhóm đã bọc sẵn.
- **`queryClient` là singleton module-level** (`app/configs/queryClient.ts`). Đủ dùng vì
  app render phía client; nếu sau này fetch ở server thì phải đổi sang instance mỗi request.
- **Metadata**: trang `(public)` tĩnh + các trang chi tiết công khai (bài viết, loại đề, bộ đề,
  tài liệu) đã có `generateMetadata` chạy ở server qua `app/utils/serverApi.ts`. Helper đó
  không mang cookie nên chỉ gọi được endpoint `permitAll`. Trang tra cứu chứng chỉ theo mã cố
  tình để `noindex` và không đưa dữ liệu người học vào thẻ OG.
- **`sitemap.ts` sinh động**: gộp trang tĩnh + bài viết + loại đề + tài liệu, `revalidate` 1 giờ.
  Backend chết thì các nhánh trả `null` và sitemap co lại còn phần tĩnh, không làm build vỡ.
- **404 cho ID không tồn tại — mới nửa vời.** Trang chi tiết gọi `notFound()` khi backend trả
  404 (phân biệt với lỗi mạng qua `fetchPublicResource`), nên người dùng thấy đúng trang "Không
  tìm thấy". Nhưng **HTTP status vẫn là 200**: `DefaultLayout` là client component bọc
  `children` nên Next đã flush shell trước khi `notFound()` kịp ném — đã đo, route nằm ngoài
  `DefaultLayout` thì trả 404 đúng. Chống index hiện dựa vào `robots: noindex` trong
  `app/not-found.tsx`. Muốn 404 thật thì phải đưa `children` ra khỏi client boundary của
  `DefaultLayout` (mất hiệu ứng `motion` chuyển trang), chưa làm.
- **Ảnh & font**: ảnh tĩnh dùng `next/image` (`imageAssets` trong `app/assets/images`, dạng
  `StaticImageData`). Ảnh nội dung (passage, banner đề thi) đi qua `components/MediaImage` — nó
  tự chọn `next/image` cho host đã khai trong `images.remotePatterns` (Cloudinary, nơi hệ thống
  upload) và lùi về `<img>` cho URL admin dán tay từ host lạ, vì `next/image` chặn cứng host
  không khai. Thêm host mới phải khai ở cả `MediaImage` lẫn `next.config.mjs`. Font nạp bằng
  `next/font` trong `layout.tsx`, dùng qua `--font-inter` / `--font-playfair`; cấm `@import`
  Google Fonts trong SCSS.
- **Thư viện nặng nạp rời** bằng `next/dynamic`: recharts (analytics, hồ sơ, so sánh lộ trình,
  lịch sử thi thử), react-simple-maps + world-atlas (bản đồ analytics), react-slick (carousel
  trang chủ và bài viết). Quill tự `import()` bên trong `RichTextEditor`. Lưu ý tuỳ chọn của
  `next/dynamic` phải viết thẳng dạng object literal, tách ra biến là build lỗi.
