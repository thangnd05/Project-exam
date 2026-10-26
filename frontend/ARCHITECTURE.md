# Kiến trúc Frontend - Next.js App Router (route-colocated + features)

> Mọi thứ nằm trong `app/`. Code của một trang sống ngay cạnh route của trang đó; code nghiệp
> vụ dùng chung giữa nhiều route nằm ở `app/features/<domain>/`; chỉ UI và hạ tầng không thuộc
> domain nào mới nằm ở `app/components/`, `app/hooks/`, `app/utils/`.

## 1. Nguyên tắc

Một màn hình = một thư mục route, bên trong có đủ page + component + hook của riêng nó.
Khác với `src/features/` của cấu trúc cũ, `app/features/` **không chứa page** - nó chỉ chứa
component/hook nghiệp vụ mà nhiều route cùng dùng.

Mọi thứ (component, hook, hàm) đặt ở nơi **gần nhất** chứa đủ mọi chỗ dùng nó:

1. Chỉ một route (hoặc một nhánh route) dùng → `_components/`, `_hooks/`, `_lib/` của
   route/nhánh đó. Dùng chung cho cả một route group thì đặt ở cấp group
   (`(admin)/_components`, `(admin)/_hooks/useAdminCrud.ts`, `(public)/_components`) để thư
   mục URL bên dưới (`(admin)/admin/`) chỉ còn route con.
2. Chỉ một component dùng → `hooks/` trong thư mục component đó
   (vd. `features/posts/CreatePostModal/hooks/useSavePost.ts`).
3. Nghiệp vụ của một domain, dùng ở nhiều route/nhóm route → `app/features/<domain>/`
   (component ở thư mục PascalCase, hook ở `hooks/`; vd. `features/learning-plans/hooks/usePlanDetail.ts`).
   Route group tách một domain ra nhiều nhánh (`(guest)/my-target` và `(user)/my-target`)
   nên domain không có route nào làm "nhà" chung - `features/<domain>` đóng vai trò đó.
   Hook đọc context của một domain cũng theo domain đó (vd. `features/gamification/streak/hooks/useStreak.ts`),
   còn context vẫn khai ở `app/contexts/` vì `providers.tsx` lắp tất cả provider một chỗ.
4. Không thuộc domain nào mới vào tầng chung: UI kit ở `app/components/` (`Button`, `modal`,
   `layouts`...), hook hạ tầng ở `app/hooks/` (`useAuth`, `usePermission`, `useDebouncedValue`,
   `useMounted`, `useSearchParamsState`), hàm thuần ở `app/utils/`.

## 2. Cấu trúc thư mục

```
frontend/
  proxy.ts                      # chặn đăng nhập + ghép ngôn ngữ (next-intl) ở tầng server
                                #   (Next 16 đổi tên middleware.ts)
  app/
    layout.tsx                  # chỉ trả children; <html> nằm ở [locale]/layout.tsx
    providers.tsx               # QueryClient + Auth/Streak/Coin/Cosmetic + Toast
    global-error.tsx            # lưới an toàn khi chính root layout lỗi
    not-found.tsx               # 404 cho đường dẫn proxy bỏ qua (tệp tĩnh không tồn tại)
    robots.ts  sitemap.ts
    [locale]/                   # vi (mặc định, không tiền tố) | en (/en/...), xem mục i18n
      layout.tsx                # root layout thật: <html lang>, next/font, metadata/OG, CSS global
      not-found.tsx  [...rest]/ # 404 trong khung giao diện, đúng ngôn ngữ
      (public)/ (user)/ (user-focus)/ (guest)/ (guest-exam)/ (guest-focus)/ (admin)/ (bare)/
                                # 8 nhóm route: khác nhau ở layout + guard, không đổi URL
                                # mỗi nhóm có layout.tsx + loading.tsx + error.tsx
    i18n/                       # routing.ts (locale, localizeHref), request.ts, navigation.tsx
                                #   (Link/useLocalizeHref/useBarePathname), metadata.ts (hreflang),
                                #   messages/<vi|en>/<Namespace>.json
    apis/                       # axiosClient + 40 *Api.ts (typed Promise<T>)
    assets/                     # ảnh + styles/ (GlobalStyles, mixins, global-overrides)
    components/                 # UI kit không thuộc domain nào: Button, modal, Loading, Pagination,
                                #   PageHeader, MediaImage, RichTextEditor, ErrorView, NotFound, ...
      layouts/                  #   DefaultLayout + Header, Footer, MobileBottomNav... (AdminLayout,
                                #   AuthLayout chỉ một nhóm dùng nên ở (admin)/_components, (auth)/_components)
    features/                   # nghiệp vụ dùng chung ≥2 route, mỗi domain một thư mục:
      <domain>/                 #   <Component>/ + hooks/ (+ file .ts thuần như examTypeKeys, plan-cache)
                                #   auth, certificates, classes, exam-layout, exam-types, gamification/<x>,
                                #   learning-plans, my-target, notes, posts, resources, tests
    hooks/                      # chỉ hook hạ tầng không thuộc domain nào (xem mục 1)
    configs/                    # Routes.ts, adminPermissions.ts (dùng enum PermissionCode), queryClient.ts,
                                #   queryKeys.ts (query key của tài nguyên đọc ở nhiều nơi)
    contexts/                   # Auth/Coin/Cosmetic/Streak context
    enums/                      # enum mirror backend (QuestionType, TestStatus, ...)
    types/                      # interface mirror DTO backend, theo domain + index.ts barrel
    utils/                      # hàm thuần dùng chung
    constants/                  # hằng số dùng chung, kể cả cho server component (theme.ts)
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
  _lib/               # hàm thuần / dữ liệu chỉ route này dùng (không phải hook)
  [id]/ create/ ...   # route con lặp lại đúng bộ trên
```

Tiền tố `_` khiến Next bỏ qua thư mục khi dựng route - nhờ vậy component nằm cạnh trang
mà không tự biến thành URL.

## 3. Quy ước

| Hạng mục | Quy ước |
|---|---|
| Ngôn ngữ | TypeScript toàn bộ (`.tsx` cho component, `.ts` cho hook/util/api) |
| Alias | `@/` trỏ gốc `frontend/` - luôn import `@/app/...` |
| `page.tsx` | Server component, không `'use client'`, chỉ render component chính |
| Component chính | `'use client'`, `export default`, tên trùng thư mục route, bỏ hậu tố `Page` |
| File `.ts` không phải component | camelCase như hiện có (`useTestSession.ts`, `planLabels.ts`) |
| Style | SCSS module cạnh component; cấm hex/rgba literal - dùng token trong GlobalStyles |
| Lớp nổi | Header, thanh dưới, nút nổi, modal dùng `var(--z-*)` trong GlobalStyles; toast/tooltip luôn trên modal |
| Icon / loading | Chỉ dùng `lucide-react`; tải cả trang/khu vực dùng `<Loading />`, `Spinner` chỉ cho nút hoặc dòng nhỏ |
| Server state | TanStack Query, `queryFn` gọi hàm trong `app/apis/`, không dùng `useEffect` + `useState` để fetch |
| Query key | Tài nguyên được đọc ở ≥2 nơi phải dùng key trong `app/configs/queryKeys.ts` (một gốc cho mỗi tài nguyên, mutation invalidate gốc). Cùng key thì cùng `queryFn`; biến đổi dữ liệu đặt trong `select` |
| Kiểu dữ liệu API | lấy từ `@/app/types`, enum từ `@/app/enums` (mirror DTO backend) |
| Lỗi API | `catch (error)` / `onError: (error: ApiError)` (không `any`), lấy thông báo bằng `getApiErrorMessage(error, fallback)` trong `app/utils/apiError.ts` (đọc `message` → `detail` → `error`) |

## 4. Tra nhanh: tìm code ở đâu

**Quy tắc một câu: URL trên trình duyệt chính là đường dẫn thư mục.** `/my-target/dashboard`
→ `app/[locale]/(user)/my-target/dashboard/TargetDashboard.tsx`. Thư mục `[locale]` và thư mục
trong ngoặc không nằm trong URL (bản tiếng Anh chỉ thêm tiền tố `/en`), khi mò thì bỏ qua chúng. Nhanh nhất là `Ctrl+P` gõ tên màn hình - mỗi màn hình có đúng một file
mang tên nó, không còn hàng chục `index.js` trùng tên như cấu trúc cũ.

| Cần tìm | Vào đâu |
|---|---|
| Component/hook/hàm chỉ một trang dùng | `_components/`, `_hooks/`, `_lib/` ngay trong thư mục trang; nhiều trang con cùng dùng thì đặt ở thư mục cha gần nhất |
| Component/hook nghiệp vụ dùng ≥2 route | `app/features/<domain>/` (hook ở `hooks/`) |
| UI dùng chung không thuộc domain | `app/components/` (mỗi component một thư mục, không có barrel) |
| Component chỉ khu admin dùng (adminKit, widget analytics) | `app/[locale]/(admin)/_components/` |
| Hook chỉ khu admin dùng (vd. `useAdminCrud`) | `app/[locale]/(admin)/_hooks/` |
| Chữ hiển thị đã dịch | `app/i18n/messages/<vi|en>/<Namespace>.json` |
| Hook hạ tầng (user hiện tại, quyền, util, URL state) | `app/hooks/` (không có barrel) |
| Hàm gọi API | `app/apis/<tên>Api.ts` |
| Kiểu dữ liệu backend trả về | `app/types/` |
| Màu, biến CSS | `app/assets/styles/GlobalStyles/` |

> **Bẫy hay nhầm nhất:** 27 trang quản trị nằm ở `(admin)/admin/*`, nhưng
> `/admin/create-test-from-bank` và `/admin/personal-question-bank` lại nằm ở
> **`(user)/admin/*`**. Hai trang này chỉ cần đăng nhập chứ không cần quyền admin, nên phải
> ở nhóm có guard khác - URL giống nhau nhưng lớp bảo vệ khác nhau. Tìm trong `(admin)` sẽ
> không thấy chúng.

## 5. Điểm cần biết

- **Browser không gọi thẳng backend.** `next.config.mjs` rewrite `/api/*`,
  `/oauth2/authorization/*`, `/login/oauth2/*` sang `API_ORIGIN`. Nhờ cùng origin, cookie
  `accessToken` (HttpOnly do Spring set) thuộc domain FE và không cần CORS. `axios` chạy với
  `baseURL` rỗng - đừng đặt lại `NEXT_PUBLIC_API_BASE_URL` trừ khi cố ý bỏ proxy.
  - Backend đi kèm: `google.redirect-uri=${app.frontend.origin}/login/oauth2/code/google`,
    và URI đó phải được khai trong Google Cloud Console.
- **Chặn đăng nhập hai lớp.** `proxy.ts` (tên mới của `middleware.ts` từ Next 16) chỉ xem có
  cookie `accessToken` hay không rồi đá về `/login?from=...`, bỏ được cú nháy spinner.
  `AuthGuard` (`features/auth/AuthGuard`) vẫn giữ vì nó mới là chỗ kiểm quyền chi tiết (`requiredPermission`) và xử lý
  được trường hợp access token hết hạn nhưng refresh token còn sống.
  - Đổi/bổ sung route cần đăng nhập thì phải sửa `PROTECTED_PREFIXES` trong `proxy.ts`, nó không tự
    suy ra từ nhóm route. (`matcher` giờ bắt mọi trang vì trang nào cũng phải qua bước ghép ngôn ngữ.)
- **`useSearchParams` bắt buộc nằm trong `<Suspense>`** - mỗi layout nhóm đã bọc sẵn.
- **`queryClient` là singleton module-level** (`app/configs/queryClient.ts`). Đủ dùng vì
  app render phía client; nếu sau này fetch ở server thì phải đổi sang instance mỗi request.
- **Metadata**: trang `(public)` tĩnh + các trang chi tiết công khai (bài viết, loại đề, bộ đề,
  tài liệu) đã có `generateMetadata` chạy ở server qua `app/utils/serverApi.ts`. Helper đó
  không mang cookie nên chỉ gọi được endpoint `permitAll`. Trang tra cứu chứng chỉ theo mã cố
  tình để `noindex` và không đưa dữ liệu người học vào thẻ OG.
- **`sitemap.ts` sinh động**: gộp trang tĩnh + bài viết + loại đề + tài liệu, `revalidate` 1 giờ.
  Backend chết thì các nhánh trả `null` và sitemap co lại còn phần tĩnh, không làm build vỡ.
- **404 cho ID không tồn tại - mới nửa vời.** Trang chi tiết gọi `notFound()` khi backend trả
  404 (phân biệt với lỗi mạng qua `fetchPublicResource`), nên người dùng thấy đúng trang "Không
  tìm thấy". Nhưng **HTTP status vẫn là 200**: `DefaultLayout` là client component bọc
  `children` nên Next đã flush shell trước khi `notFound()` kịp ném - đã đo, route nằm ngoài
  `DefaultLayout` thì trả 404 đúng. Chống index hiện dựa vào `robots: noindex` trong
  `app/[locale]/not-found.tsx`. Muốn 404 thật thì phải đưa `children` ra khỏi client boundary của
  `DefaultLayout` (mất hiệu ứng `motion` chuyển trang), chưa làm.
- **Ảnh & font**: ảnh tĩnh dùng `next/image` (`imageAssets` trong `app/assets/images`, dạng
  `StaticImageData`). Ảnh nội dung (passage, banner đề thi) đi qua `components/MediaImage` - nó
  tự chọn `next/image` cho host đã khai trong `images.remotePatterns` (Cloudinary, nơi hệ thống
  upload) và lùi về `<img>` cho URL admin dán tay từ host lạ, vì `next/image` chặn cứng host
  không khai. Thêm host mới phải khai ở cả `MediaImage` lẫn `next.config.mjs`. Font nạp bằng
  `next/font` trong `[locale]/layout.tsx`, dùng qua `--font-inter` / `--font-playfair`; cấm `@import`
  Google Fonts trong SCSS.
- **Song ngữ (next-intl).** Tiếng Việt mặc định không tiền tố, tiếng Anh ở `/en/...`; ngôn ngữ chỉ
  lấy từ URL (không đoán theo trình duyệt/cookie). Mọi trang đều có hai bản; chữ hiển thị nằm ở
  `app/i18n/messages/<vi|en>/<Namespace>.json` (thiếu key ở bản `en` là `tsc` báo lỗi). Dữ liệu từ
  backend (tên kỳ thi, câu hỏi, bài viết...) chưa dịch. Trang công khai thêm
  `alternates: localeAlternates(locale, path)` vào metadata để có hreflang.
  - `Link`, `useRouter`, `usePathname` luôn import từ `@/app/i18n/navigation`, không từ
    `next/link` / `next/navigation`: bản này tự gắn `/en` khi đang xem tiếng Anh (`router.push('/x')`
    → `/en/x`) và `usePathname()` trả đường dẫn không tiền tố, nên code vẫn viết đường dẫn trơn.
    Chỉ `window.location` mới phải tự bọc `useLocalizeHref()`.
  - Ở server luôn gọi `getTranslations({ locale, namespace })` với `locale` lấy từ `params`; gọi
    không có `locale` thì next-intl đọc header và kéo trang sang render động.
- **Thư viện nặng nạp rời** bằng `next/dynamic`: recharts (analytics, hồ sơ, so sánh lộ trình,
  lịch sử thi thử), react-simple-maps + world-atlas (bản đồ analytics), react-slick (carousel
  trang chủ và bài viết). Quill tự `import()` bên trong `RichTextEditor`. Lưu ý tuỳ chọn của
  `next/dynamic` phải viết thẳng dạng object literal, tách ra biến là build lỗi.
