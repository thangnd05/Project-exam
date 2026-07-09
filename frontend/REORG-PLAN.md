# Quy hoạch tái cấu trúc FE — sang `features/` + `shared/` (co-locate API)

> Kế thừa tinh thần [ARCHITECTURE.md](ARCHITECTURE.md) (feature-slice) nhưng đẩy lên
> mức đầy đủ: **mỗi feature tự chứa cả `api/` của nó**, chỉ hạ tầng + thứ dùng-chéo
> nằm ở `shared/`. Làm **incremental**, mỗi batch 1 commit + `pnpm build` xanh.

## 1. Cấu trúc đích

```
src/
  app/                 # bootstrap: index.js, App.js, routes/, providers
  shared/              # "core" — hạ tầng & UI generic dùng chung THẬT SỰ
    api/               #   axiosClient + API dùng-chéo (test/exam core, auth)
    ui/                #   ButtonPrime, BaseModal, PageHeader, Pagination, modal/…
    styles/            #   GlobalStyles
    hooks/  utils/  config/  context/  assets/
  features/            # mỗi feature = lát cắt dọc tự chứa
    <feature>/
      api/             #   API CHỈ feature này dùng (co-locate)
      pages/  components/  hooks/  modals/  styles/   # có gì tạo nấy
  admin/               # cũng feature-slice (admin/<x>/{api,pages,components})
```

**Nguyên tắc "có gì tạo nấy"** — KHÔNG ép mỗi feature đủ bộ folder (tránh folder rỗng).

## 2. Quy tắc đặt API (áp dụng máy móc theo số feature import)

| Số feature import | Đặt ở |
|---|---|
| 1 feature | `features/<đó>/api/` — co-locate |
| 2 feature | feature **sở hữu nghiệp vụ** giữ; feature kia import qua `~/features/x/api` |
| ≥3 / hạ tầng | `shared/api/` |

**Ở lại `shared/api/`** (dùng-chéo ≥3 hoặc hạ tầng): `axiosClient`, `authApi`,
`testApi`(7), `examTypeApi`(5), `userTestApi`(5), `examPartApi`(4),
`evaluationApi`(3), `postApi`(3), `userTargetApi`(3).
**Co-locate** (1 feature): `vocabularyAlbumApi`, `vocabularyApi`, `questApi`,
`coinApi`, `cosmeticApi`, `questionApi`, `streakApi`, `roleApi`, `permissionApi`,
`adminAuditApi`, `classMemberApi`, `practiceQuestionApi`, `testPartApi`,
`userAnswerApi`. (Nhóm 2-feature quyết định owner khi tới batch của nó.)

## 3. Quy ước import

- Trong cùng feature → tương đối `./`, `../`.
- Chéo feature / tới shared → alias `~/features/…`, `~/shared/…`.
- Tránh `../../../..` chui ra ngoài feature.

## 4. Bẫy đã biết (từ lần migrate trước)

- **`@import` scss KHÔNG hiểu alias `~/`** và phụ thuộc độ sâu. 32 file `.module.scss`
  đang `@import '../../.../components/GlobalStyles/GlobalStyles.module.scss'`.
  → **Batch 2 fix một lần** bằng sass `loadPaths=[src]` rồi chuẩn hoá mọi @import về
  path ổn định `shared/styles/GlobalStyles/GlobalStyles.module.scss` (không còn phụ
  thuộc độ sâu → mọi lần move sau đều an toàn).
- **Verify build đúng**: đọc exit của `pnpm build`, grep `Failed to compile`.
- **Rename cùng cấp không đụng scss**: `pages→features` giữ nguyên độ sâu → 32 @import
  không đổi. Chỉ khi đụng `GlobalStyles` mới cần Batch 2.

## 5. Lộ trình batch (nhỏ → cross-cutting)

- [x] **B1 — `pages/ → features/`** ✅ build xanh. Sửa 55 `~/pages/` + 1 import lạc.
- [x] **B2 — Foundation scss** ✅ sass `loadPaths=[srcDir]`; 35 tham chiếu GlobalStyles
      (@import + @use) chuẩn hoá về path ổn định. De-risk mọi batch sau.
- [x] **B3 — `shared/` (JS buckets)** ✅ `hooks utils config context assets` → `shared/*`.
      Đã đưa ref băng-ranh-giới về `~/` trước khi move (giữ `../hooks` feature-local).
- [x] **B4 — `shared/ui` + `shared/styles`** ✅ `components/common`→`shared/ui` (146 ref),
      `components/GlobalStyles`→`shared/styles/GlobalStyles`.
- [x] **B5 — re-home `components/*`** ✅ `coin cosmetic resources streak test` →
      `shared/` (đều dùng-chéo); `Comment/` **xoá** (dead, 0 importer). `components/`
      giải tán hoàn toàn.
- [x] **B6 — co-locate API** ✅ 8 API 1-chủ → owner (`classMemberApi`→myclass,
      `practiceQuestionApi`→album-pratice, `userAnswerApi`→exam, `vocabularyAlbumApi`→
      album-voca, `vocabularyApi`→album-delta, `adminAuditApi/permissionApi/roleApi`→
      admin); 28 API dùng-chéo → `shared/api/`. Sibling `./axiosClient` trong file
      co-locate sửa về `~/shared/api/`.
- [x] **B7 — `app/` bootstrap** ✅ `index.js App.js routes/`→`app/`; entry
      `index.html`→`/src/app/index.js`. (`setupTests.js` để lại gốc — vite.config trỏ tới.)
- [x] **B8 — admin/ domain-slice** ✅ gom 27 trang phẳng thành 5 domain (access,
      exam-content, gamification, content, overview), mỗi domain có `hooks/` riêng;
      giữ `components/ modals/ data/ api/ layouts/` shared ở gốc admin (domain cùng cấp
      `pages/` nên `../components`/`../modals`/`../data` tự đúng). Xoá barrel `index.js` dead.
      **KHÔNG** tách per-resource (27 micro-folder = over-engineering).

## 7. Kết quả cuối (đã build xanh mỗi batch)

```
src/
  app/       index.js App.js routes/
  features/  <feature>/{api?,pages,components,hooks,modals,styles}
  shared/    api/ ui/ styles/ hooks/ utils/ config/ context/ assets/
             coin/ cosmetic/ resources/ streak/ test/   (domain/widget dùng-chéo)
  admin/     (+ api/)   layout/   setupTests.js
```

### Quy trình mỗi batch
1. `git mv`. 2. Sửa import nội bộ file vừa chuyển. 3. Sửa file import nó (global sed theo prefix).
4. `grep` xác nhận 0 path cũ sót. 5. `pnpm build` xanh. 6. Commit.
