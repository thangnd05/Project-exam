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
  app/
    layout.tsx                  # root layout: <html>, metadata/OG, nạp CSS global
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

## 4. Điểm cần biết

- **Auth vẫn kiểm ở client** (`AuthGuard`) vì JWT chưa nằm trong cookie httpOnly; do đó
  chưa có `middleware.ts`. Muốn chặn ở tầng server thì phải đổi cách lưu token trước.
- **`useSearchParams` bắt buộc nằm trong `<Suspense>`** — mỗi layout nhóm đã bọc sẵn.
- **`queryClient` là singleton module-level** (`app/configs/queryClient.ts`). Đủ dùng vì
  app render phía client; nếu sau này fetch ở server thì phải đổi sang instance mỗi request.
- **Metadata**: mới có ở vài trang `(public)`. Trang chi tiết (bài viết, chứng chỉ, loại đề)
  nên bổ sung `generateMetadata` để có lợi ích SEO thật.
