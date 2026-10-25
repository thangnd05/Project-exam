# Bản đồ URL frontend

Tổng hợp từ `app/[locale]/**/page.tsx`, [app/configs/Routes.ts](app/configs/Routes.ts), [proxy.ts](proxy.ts) và các chỗ gọi `Link href` / `router.push` / `router.replace` trong code (quét ngày 2026-10-25).

## Quy ước chung

- **Ngôn ngữ**: tiếng Việt không có tiền tố (`/exam-types`), tiếng Anh nằm dưới `/en` (`/en/exam-types`). Mọi URL bên dưới đều có bản `/en/...` tương ứng.
- **Đăng nhập**: [proxy.ts](proxy.ts) chặn các tiền tố `/admin`, `/albums`, `/certificates`, `/class`, `/classes`, `/dashboard`, `/learning-plans`, `/my-*`, `/practice`. Chưa đăng nhập thì chuyển sang `/login?from=<url cũ>&flash=...`.
  - Ngoại lệ mở cho khách: `/certificates/verify/**`, và đúng 3 trang `/learning-plans`, `/learning-plans/generate`, `/my-target` (khách xem được, bấm thao tác mới bắt đăng nhập).
  - Các layout `(user)`, `(user-focus)`, `(admin)`... còn bọc `AuthGuard` phía client: chưa đăng nhập → `/login?...`, không đủ quyền → `/not-found`.
- **Slug**: kỳ thi dùng `/exam-types/<nhóm>/<kỳ thi>` (vd `/exam-types/aws/saa-c03`). Link cũ `/exam-types/<uuid>` được proxy trả 308 sang slug. Bài thi dùng `/tests/<slug hoặc testId>/<start|history|leaderboard>`.
- **Không phải trang** (rewrite sang backend): `/api/*`, `/oauth2/authorization/*`, `/login/oauth2/*`.
- URL không khớp route nào → `[...rest]` → trang 404.

Ký hiệu cột "Truy cập": 🌐 công khai · 👤 cần đăng nhập · 👁 khách xem được, thao tác cần đăng nhập · 🔒 admin (theo quyền trong [adminPermissions.ts](app/configs/adminPermissions.ts)).

---

## 1. Danh sách URL

### Công khai `(public)` — có Header/Footer

| URL | Trang | Truy cập |
|---|---|---|
| `/` | Trang chủ (Hero, Certification Orbit, Rank Scope) | 🌐 |
| `/about` | Giới thiệu | 🌐 |
| `/policy` | Chính sách | 🌐 |
| `/service` | Điều khoản dịch vụ | 🌐 |
| `/coming-soon` | Sắp ra mắt | 🌐 |
| `/exam-types` | Danh mục kỳ thi | 🌐 |
| `/exam-types/:group` | Nhóm kỳ thi / kỳ thi một cấp (danh sách đề, bộ đề) | 🌐 |
| `/exam-types/:group/:exam` | Chi tiết kỳ thi (đề thi thử, bộ đề) | 🌐 |
| `/exam-types/:group/collections/:collectionId` | Bộ đề thuộc kỳ thi một cấp | 🌐 |
| `/exam-types/:group/:exam/collections/:collectionId` | Bộ đề thuộc kỳ thi hai cấp | 🌐 |
| `/posts` | Danh sách bài viết | 🌐 |
| `/posts/:postId` | Chi tiết bài viết | 🌐 |
| `/resources` | Tài liệu ôn tập | 🌐 |
| `/certificates/verify` | Tra cứu chứng chỉ + tường chứng chỉ | 🌐 |
| `/certificates/verify/:code` | Kết quả xác minh chứng chỉ theo mã | 🌐 |

### Xác thực `(auth)`

| URL | Trang | Truy cập |
|---|---|---|
| `/login` | Đăng nhập / đăng ký (`?mode=signin\|signup`, `?from=`, `?flash=`, `?error=`) | 🌐 |
| `/forgot` | Quên mật khẩu | 🌐 |
| `/reset` | Đặt lại mật khẩu (link từ email) | 🌐 |
| `/oauth2/redirect` | Nhận kết quả đăng nhập Google/Facebook rồi chuyển tiếp | 🌐 (nằm trong `(user)` nhưng không bị proxy chặn) |

### Trang trần `(bare)` — không Header/Footer

| URL | Trang | Truy cập |
|---|---|---|
| `/resources/:resourceId` | Xem tài liệu phục hồi (recovery resource) | 🌐 |
| `/not-found` | Trang 404 (AuthGuard đẩy về đây khi thiếu quyền) | 🌐 |

### Khách & người dùng `(guest)`, `(guest-exam)`, `(guest-focus)` — khách vẫn làm bài được

| URL | Trang | Truy cập |
|---|---|---|
| `/tests/:testId/start` | Làm bài thi (giao diện thi) | 🌐 |
| `/tests/result/:userTestId` | Kết quả bài thi | 🌐 |
| `/tests/result/:userTestId/review` | Xem lại đáp án (focus mode) | 🌐 |
| `/learning-plans` | Trang trung chuyển "Lộ trình" (chỉ redirect, xem mục 3) | 👁 |
| `/learning-plans/generate` | Sinh lộ trình học + danh sách lộ trình | 👁 |
| `/my-target` | Đặt mục tiêu kỳ thi (`?examTypeId=`, `?next=`) | 👁 |

### Người dùng `(user)` — cần đăng nhập

| URL | Trang | Truy cập |
|---|---|---|
| `/dashboard` | Hồ sơ / tổng quan cá nhân | 👤 |
| `/my-target/dashboard` | Bảng mục tiêu (`?examTypeId=`) | 👤 |
| `/my-target/achieved` | Đã đạt mục tiêu | 👤 |
| `/my-target/mocks` | Redirect sang `/my-target/dashboard` (giữ query) | 👤 |
| `/learning-plans/compare` | So sánh các lộ trình | 👤 |
| `/learning-plans/:learningPlanId` | Chi tiết lộ trình | 👤 |
| `/learning-plans/:learningPlanId/tasks/:taskId/history` | Lịch sử làm một nhiệm vụ | 👤 |
| `/tests/:testId/history` | Lịch sử làm đề | 👤 |
| `/tests/:testId/leaderboard` | Bảng xếp hạng đề | 👤 |
| `/my-certificates` | Chứng chỉ của tôi | 👤 |
| `/certificates/:certificateId` | Chi tiết chứng chỉ | 👤 |
| `/my-albums` | Thẻ ghi nhớ của tôi *(đang ẩn khỏi menu)* | 👤 |
| `/albums/:albumId` | Chi tiết bộ thẻ *(đang ẩn)* | 👤 |
| `/practice/:albumId` | Luyện bộ thẻ *(đang ẩn)* | 👤 |
| `/my-classes` | Lớp học của tôi *(đang ẩn)* | 👤 |
| `/class/:classId/chapters` | Chương của lớp *(đang ẩn)* | 👤 |
| `/class/:classId/members` | Thành viên lớp *(đang ẩn)* | 👤 |
| `/classes/:classId/chapters/:chapterId/tests` | Bài thi của chương *(đang ẩn)* | 👤 |
| `/admin/personal-question-bank` | Ngân hàng câu hỏi cá nhân *(đang ẩn)* | 👤 |
| `/admin/create-test-from-bank` | Tạo đề từ ngân hàng *(không có link nào trỏ tới)* | 👤 |

### Người dùng – focus mode `(user-focus)` — không Header/Footer

| URL | Trang | Truy cập |
|---|---|---|
| `/learning-plans/:learningPlanId/study` | Học nhiệm vụ (`?taskId=`) | 👤 |
| `/learning-plans/:learningPlanId/tasks/:taskId/result` | Kết quả nhiệm vụ | 👤 |
| `/learning-plans/:learningPlanId/sessions/:sessionId/review` | Xem lại một phiên học (`?taskId=`) | 👤 |

### Quản trị `(admin)` — layout có sidebar riêng

Tất cả 🔒, mỗi trang kiểm tra quyền riêng.

| URL | Trang |
|---|---|
| `/admin/dashboard` | Tổng quan |
| `/admin/analytics` | Phân tích |
| `/admin/users` | Người dùng |
| `/admin/roles` | Vai trò |
| `/admin/permissions` | Quyền |
| `/admin/exam-types` | Kỳ thi |
| `/admin/exam-types/:examTypeId/layout` | Bố cục giao diện thi của kỳ thi |
| `/admin/tags` | Thẻ (tag) |
| `/admin/exam-categories` | Danh mục kỳ thi |
| `/admin/exam-parts` | Phần thi |
| `/admin/skills` | Kỹ năng |
| `/admin/questions` | Câu hỏi |
| `/admin/question-collections` | Bộ câu hỏi |
| `/admin/scoring-conversion` | Quy đổi điểm |
| `/admin/milestones` | Mốc |
| `/admin/tests` | Đề thi |
| `/admin/recovery-resources` | Tài liệu phục hồi |
| `/admin/certificates` | Chứng chỉ |
| `/admin/categories` | Danh mục bài viết |
| `/admin/posts` | Bài viết |
| `/admin/evaluations` | Đánh giá |
| `/admin/coins` | Xu |
| `/admin/quests` | Nhiệm vụ |
| `/admin/cosmetics` | Vật phẩm trang trí |
| `/admin/streak-recover` | Khôi phục chuỗi |
| `/admin/emails` | Email |
| `/admin/audit-logs` | Nhật ký thao tác |
| `/admin/audit-login` | Nhật ký đăng nhập |

---

## 2. Điều hướng chung (có ở mọi trang dùng layout mặc định)

**Header** ([Header/index.tsx](app/components/layouts/Header/index.tsx))
- Logo → `/`
- Menu: Xác minh chứng chỉ `/certificates/verify` · Kỳ thi `/exam-types` · Tài liệu `/resources` · Bài viết `/posts` · Lộ trình `/learning-plans`
- Khách: Đăng nhập `/login?mode=signin&from=<trang hiện tại>` · Đăng ký `/login?mode=signup&from=...`
- Menu tài khoản: Hồ sơ `/dashboard` · Chứng chỉ của tôi `/my-certificates` · Cài đặt (modal, đổi ngôn ngữ = đổi tiền tố URL) · Đăng xuất → `/`
- Đang ẩn (comment): Thẻ ghi nhớ `/my-albums`, dropdown Lớp học `/my-classes`

**Thanh điều hướng mobile** ([MobileBottomNav](app/components/layouts/MobileBottomNav/index.tsx)) — ẩn trên `/login`, `/forgot`, `/reset`, `/oauth2`, `/admin`
- `/` · `/exam-types` · `/posts` · `/learning-plans` · menu thêm: `/resources`, `/dashboard`, `/my-certificates`, `/login?mode=signin|signup`

**Footer** ([Footer](app/components/layouts/Footer/index.tsx))
- `/` · `/exam-types` · `/learning-plans/generate` · `/about` · `/policy` · `/service`

**Trang 404** → `/`

---

## 3. Từ trang nào đi được tới đâu

### Công khai

| Từ | Đi tới |
|---|---|
| `/` (Hero) | `/exam-types`, `/coming-soon`; "Thi nhanh" → `/tests/:slug/start`; chưa có mục tiêu → `/my-target` hoặc `/learning-plans/generate`; khách → `/login?...` |
| `/` (Certification Orbit) | `/exam-types/:group/:exam`, `/learning-plans`, `/coming-soon` |
| `/` (Rank Scope) | `/exam-types` |
| `/coming-soon` | `/exam-types`, `/` |
| `/exam-types` | `/exam-types/:group[/:exam]` |
| `/exam-types/:group[/:exam]` | Bộ đề `.../collections/:collectionId` · Thẻ đề: Bắt đầu `/tests/:slug/start`, Lịch sử `/tests/:slug/history`, Xếp hạng `/tests/:slug/leaderboard` · Đặt mục tiêu `/my-target?examTypeId=` (khách → `/login`) · `/exam-types`, `/resources` |
| `.../collections/:collectionId` | Về kỳ thi `/exam-types/:group[/:exam]` · đề trong bộ → `/tests/:slug/start` |
| `/posts` | `/posts/:postId` |
| `/posts/:postId` | `/`, `/posts`, bài liên quan `/posts/:id` |
| `/certificates/verify` | Nhập mã → `/certificates/verify/:code` · tường chứng chỉ → `/certificates/verify/:code` |
| `/resources/:resourceId` | `/` |

### Xác thực

| Từ | Đi tới |
|---|---|
| `/login` | Thành công → URL trong `?from=` (mặc định `/`) · `/forgot` (form nội tuyến) · `/service`, `/policy` · Google/Facebook → `/oauth2/authorization/*` (backend) → `/oauth2/redirect` |
| `/oauth2/redirect` | Lỗi → `/login?error=...` · thành công → URL đã lưu trước khi đăng nhập (mặc định `/`) |
| `/forgot` | `/login` |
| `/reset` | Thành công → `/login` · `/forgot` |

### Làm bài & kết quả

| Từ | Đi tới |
|---|---|
| `/tests/:testId/start` | Nộp bài / hết giờ → `/tests/result/:userTestId` · link bằng id được đổi sang `/tests/:slug/start` |
| `/tests/result/:userTestId` | Xem lại → `/tests/result/:userTestId/review` (bảng phân tích tag → `.../review#rq-<questionId>`) · Lịch sử → `/tests/:testId/history` · Gauge sẵn sàng → `/exam-types/:examTypeId` · Tạo lộ trình → `/learning-plans/generate?userTestId=&examTypeId=` (chưa có mục tiêu → `/my-target?examTypeId=&next=...`) · Chứng chỉ → `/certificates/:certificateId`, `/learning-plans/generate` · Khách lưu bài → `/login?...` · Về `/` |
| `/tests/result/:userTestId/review` | `/tests/result/:userTestId`, `/` |
| `/tests/:testId/history` | Tab (header đề): `/exam-types`, kỳ thi, `/tests/:slug/history`, `/tests/:slug/leaderboard`, `/tests/:slug/start` · lượt làm → `/tests/result/:userTestId` |
| `/tests/:testId/leaderboard` | Tab giống trang lịch sử |

### Mục tiêu & lộ trình

| Từ | Đi tới |
|---|---|
| `/learning-plans` (trung chuyển) | Khách → `/my-target` · có query → `/learning-plans/generate?...` · có lộ trình ACTIVE → `/learning-plans/:newestId` · chưa có → `/learning-plans/generate` |
| Tab mục tiêu/lộ trình (dùng chung) | `/my-target` · `/learning-plans/generate` · `/learning-plans/compare` · `/my-target/dashboard` |
| `/my-target` | Lưu xong → `?next=` hoặc `/learning-plans/generate?examTypeId=` · khách bấm lưu → `/login` |
| `/learning-plans/generate` | Tạo xong → `/learning-plans/:id` · khách → `/login` · `/exam-types`, kỳ thi nguồn · `/my-target?...` · danh sách: `/learning-plans/:id`, `/learning-plans/:id#chon-ai-hoc`, `/learning-plans/compare` |
| `/my-target/dashboard` | `/my-target`, `/my-target/achieved`, `/learning-plans/:activeId`, `/learning-plans/generate?userTestId=` · lịch sử thi thử → `/tests/result/:userTestId`, `/` |
| `/my-target/achieved` | `/my-target/dashboard`, `/my-target`, `/learning-plans/compare`, `/` |
| `/learning-plans/compare` | `/learning-plans/generate`, `/tests/result/:sourceUserTestId`, `/learning-plans/:id`, `/learning-plans/:id/study` |
| `/learning-plans/:id` | `/learning-plans/:id/study?taskId=` · nhiệm vụ: `.../tasks/:taskId/history`, `.../tasks/:taskId/result` · lộ trình thay thế `/learning-plans/:replacedById` · `/learning-plans/generate[?examTypeId=&userTestId=]` · kỳ thi `/exam-types/...` |
| `/learning-plans/:id/study` | Xong nhiệm vụ → `.../tasks/:taskId/result` · thoát → `/learning-plans/:id` · kỳ thi `/exam-types/...` |
| `.../tasks/:taskId/result` | `/learning-plans/:id` · làm lại / nhiệm vụ tiếp → `/learning-plans/:id/study?taskId=` |
| `.../tasks/:taskId/history` | `/learning-plans/:id`, `/learning-plans/:id/study?taskId=`, `.../sessions/:sessionId/review?taskId=` |
| `.../sessions/:sessionId/review` | `.../tasks/:taskId/history`, `/learning-plans/:id`, `/learning-plans/:id/study?taskId=` |

### Cá nhân

| Từ | Đi tới |
|---|---|
| `/dashboard` | Lối tắt: `/exam-types`, `/learning-plans`, `/resources`, `/my-certificates` · thẻ mục tiêu: `/my-target`, `/my-target/dashboard?examTypeId=`, `/learning-plans/generate?examTypeId=` · bài viết của tôi/đã lưu → `/posts/:postId` · (ẩn: `/my-albums`, `/my-classes`, `/admin/personal-question-bank`) |
| `/my-certificates` | `/certificates/:certificateId`, `/certificates/verify/:code`, `/` |
| `/certificates/:certificateId` | `/certificates/verify/:code`, `/my-certificates` |
| `/my-albums` *(ẩn)* | `/albums/:albumId` |
| `/albums/:albumId` *(ẩn)* | `/practice/:albumId` |
| `/my-classes` *(ẩn)* | `/class/:classId/chapters`, `/class/:classId/members` |
| `/class/:classId/chapters` *(ẩn)* | `/classes/:classId/chapters/:chapterId/tests` |
| Modal tạo đề (Header, chỉ ADMIN) | → `/admin/personal-question-bank` |

### Quản trị

| Từ | Đi tới |
|---|---|
| Sidebar admin | Tất cả 28 trang `/admin/*` ở mục 1 · về `/` · về `/dashboard` |
| `/admin/exam-types` | `/admin/exam-types/:examTypeId/layout` |
| `/admin/posts` | Xem bài `/posts/:postId` |
| Lối vào khu admin | Không có link từ giao diện người dùng — gõ thẳng `/admin/dashboard` |

---

## 4. Luồng chính

```mermaid
flowchart LR
  Home["/"] --> Exams["/exam-types"]
  Home -->|Thi nhanh| Start
  Exams --> Exam["/exam-types/:group/:exam"]
  Exam --> Coll[".../collections/:id"]
  Exam --> Start["/tests/:slug/start"]
  Coll --> Start
  Exam --> Hist["/tests/:slug/history"]
  Exam --> Lead["/tests/:slug/leaderboard"]
  Start --> Result["/tests/result/:userTestId"]
  Result --> Review[".../review"]
  Result --> Target["/my-target"]
  Result --> Gen["/learning-plans/generate"]
  Hist --> Result
  Target --> Gen
  Gen --> Plan["/learning-plans/:id"]
  Plan --> Study[".../study?taskId="]
  Study --> TaskRes[".../tasks/:taskId/result"]
  TaskRes --> Study
  TaskRes --> Plan
  Plan --> TaskHist[".../tasks/:taskId/history"]
  TaskHist --> SessRev[".../sessions/:sid/review"]
  Result --> Cert["/certificates/:id"]
  Cert --> Verify["/certificates/verify/:code"]
```

Luồng khách: làm bài → kết quả → "Lưu / tạo lộ trình" → `/login?mode=signup&from=/my-target?examTypeId=..&next=/learning-plans/generate?userTestId=..` → đặt mục tiêu → sinh lộ trình (bài vừa làm được gắn vào tài khoản sau khi đăng nhập).

---

## 5. Ghi chú

- **Trang không có link nào trỏ tới**: `/admin/create-test-from-bank`, `/my-target/mocks` (chỉ còn để redirect link cũ), cả khu `/admin/*` (vào bằng gõ URL).
- **Trang đang ẩn lối vào** (link bị comment, trang vẫn chạy nếu gõ URL): thẻ ghi nhớ (`/my-albums`, `/albums/*`, `/practice/*`), lớp học (`/my-classes`, `/class/*`, `/classes/*`), `/admin/personal-question-bank`.
- `PROTECTED_PREFIXES` trong [proxy.ts](proxy.ts) có `/tests/history` và `/tests/leaderboard`, nhưng URL thật là `/tests/:testId/history` nên proxy không chặn; hai trang này chỉ được bảo vệ bởi `AuthGuard` của layout `(user)` ở phía client.
- Trang SEO: [sitemap.ts](app/sitemap.ts) liệt kê `/`, `/about`, `/posts`, `/policy`, `/service`, `/certificates/verify`, `/exam-types` và từng trang kỳ thi; [robots.ts](app/robots.ts) chặn `/admin/`, `/my-*`, `/learning-plans/`, `/tests/`, `/dashboard`, `/oauth2/`.
