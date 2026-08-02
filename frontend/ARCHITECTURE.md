# Kiến trúc Frontend — Feature-Slice

> Tài liệu phản ánh cấu trúc **hiện tại** sau reorg B1–B8.
> Mẫu tham chiếu sạch: `src/features/albums/`, `src/features/classes/`.

## 1. Nguyên tắc

Code nhóm **theo feature**, không theo loại file. Mỗi feature tự chứa UI / modal /
hook / style nó cần. Chỉ thứ **dùng chung thật sự** nằm ở `shared/` hoặc `layout/`.

## 2. Cấu trúc thư mục

```
src/
  app/                 # bootstrap: index.js, App.js, routes/, error/
  features/            # lát cắt nghiệp vụ
    <feature>/
      hooks/  modals/  components/  pages/  styles/   # có gì tạo nấy
  shared/
    api/               # axiosClient + *Api.js (hiện gom tại đây)
    ui/  hooks/  utils/  config/  context/  styles/  assets/
    test/  coin/  cosmetic/  streak/  resources/     # domain widgets dùng-chéo
  layout/              # Header, Footer, DefaultLayout
```

API co-locate `features/*/api/` **chưa làm** — mọi `*Api.js` vẫn ở `shared/api/`.
Quy tắc đích (khi migrate tiếp): 1 feature → co-locate; ≥3 / hạ tầng → `shared/api/`.

## 3. Quy ước đặt tên

| Loại | Convention | Ví dụ |
|------|------------|--------|
| Thư mục bucket | lowercase | `hooks/`, `modals/`, `components/` |
| Component / Page file | PascalCase | `CreateClassModal.js`, `LoginPage.js` |
| Hook file + function | `use` + CamelCase | `useMyAlbums.js` → `useMyAlbums` |
| API module | camelCase `*Api.js` | `learningPlanApi.js` |
| Style | `*.module.scss` | `MyClassPage.module.scss` |

Tránh tên file lowercase cho page (`login.js` → `LoginPage.js`).

## 4. Quy ước import

- Trong cùng feature → relative `./`, `../`
- Chéo feature / shared → alias `~/features/...`, `~/shared/...`
- Tránh `../../../..` ra ngoài feature

## 5. Data layer (bắt buộc cho code mới)

```
Page → feature hook → shared/api/*Api.js → axiosClient
```

- **Không** gọi `*Api` trực tiếp trong page/component lớn (trừ bootstrap auth đơn giản).
- Hook **unwrap domain** (ưu tiên), mẫu `useMyAlbums` / `useMyClasses`:

```js
return {
  items: query.data ?? [],
  isLoading: query.isLoading,
  isError: query.isError,
  // mutations…
};
```

- Tránh trả raw `useQuery()` trừ khi hook chỉ là wrapper mỏng cho admin CRUD factory.
- Mutation-only hook (`useCreateAlbum`, `useUpdateClass`…): được phép `return useMutation(...)` với `onSuccess`/`onError` callback.
- Query key factory: `export const fooKeys = { list: ['foo'] }`.
- Tên hook **không trùng** giữa shared và admin (`useCoins` admin → `useAdminCoins`;
  `usePosts`/`useCosmetics`/`useEvaluations`/`useQuestionCollections` admin → `useAdmin*`).
- Field loading: luôn `isLoading` (không dùng `loading`).

## 6. Error & message từ API

- Đọc lỗi qua `err.response?.data?.message` (shape `ApiErrorResponse`).
- Ưu tiên helper `~/shared/utils/apiError` (`getApiErrorMessage`) thay vì copy inline.

## 7. UI / icons / forms

- Form: controlled `useState` + react-bootstrap (chưa dùng form lib).
- Modal user: `CommonFormModal` + `ModalActionFooter`; admin: `BaseModal` được chấp nhận.
- Confirm: `ConfirmModal` (chung) + `ConfirmDeleteModal` (preset xóa). Không thêm wrapper confirm mới.
- **Icon mới:** dùng `lucide-react`. Không thêm Font Awesome / `react-icons` mới.
  (Code cũ giữ nguyên; migrate dần khi đụng file.)
- Style: `*.module.scss` + `classNames/bind` (`cx`). Global tokens qua
  `shared/styles/GlobalStyles/GlobalStyles.module.scss` (`@import` hoặc `@use`).

## 8. Auth / RBAC (đối chiếu BE)

Frontend không check permission chi tiết; backend:

- RBAC: `AuthUtils.requirePermission` **trong service**
- Ownership: `*Access` guard (vd `LearningPlanAccess`)
- Controller chỉ lấy `userId` / gọi service
- Không dùng `@PreAuthorize`

## 9. Lịch sử migrate

Chi tiết batch B1–B8: xem [REORG-PLAN.md](REORG-PLAN.md). Reorg thư mục đã xong;
còn nợ: co-locate API, thống nhất icon.
