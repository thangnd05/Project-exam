# Kiến trúc Frontend — Feature-Slice

> Tài liệu này định nghĩa cách tổ chức code FE và lộ trình di dời về chuẩn
> **feature-slice**. Mẫu tham chiếu đã có sẵn: [`src/pages/learning-plan/`](src/pages/learning-plan).

## 1. Nguyên tắc

Code được nhóm **theo feature (tính năng nghiệp vụ)**, không theo loại file. Mỗi
feature tự chứa mọi thứ nó cần (UI, modal, hook, style). Chỉ những thứ **thật sự
dùng chung nhiều feature** mới nằm ở `components/common/`.

## 2. Cấu trúc thư mục

```
src/
  components/
    common/              # CHỈ UI/infra dùng chung thật sự
      modal/             # CommonFormModal, ModalActionFooter (vỏ form chung)
                         # ConfirmModal + ConfirmActionModal + ConfirmDeleteModal (confirm dùng chéo)
      BackgroundDecor/  MotionSection/  PageHeader/
  pages/
    <feature>/           # gốc của một feature, vd: myclass, album-voca, profile
      components/        # component riêng của feature
      hooks/             # hook riêng của feature
      modals/            # modal riêng của feature
      pages/             # các trang (route) của feature
      styles/            # *.module.scss của feature
  admin/                 # khu admin, cũng feature-slice (pages/, modals/, ...)
  api/  config/  context/  hooks/  layout/  routes/  utils/  assets/
```

> Không bắt buộc feature nào cũng đủ 5 thư mục con — có gì tạo nấy. Feature nhỏ
> có thể chỉ cần `modals/` + file trang phẳng.

## 3. Quy ước đặt tên

- **Thư mục gom nhóm** (bucket) → **lowercase**: `pages`, `components`, `common`,
  `modals`, `hooks`, `admin`, `layout`, `api`...
- **Thư mục đại diện một component** → **PascalCase**: `PageHeader/`, `ClassCard/`,
  `GlobalStyles/`, `Comment/`, `Header/`...
- File component React: **PascalCase** (`CreatePostModal.js`). Hook: `use-kebab.js`
  hoặc `useCamel.js` (giữ theo cái đang có trong feature).

## 4. Quy ước import

- **Trong cùng feature** → đường dẫn tương đối: `./modals/X`, `../hooks/Y`.
- **Chéo feature / tới shared** → dùng alias `~/`: `~/components/common/...`,
  `~/api/axiosClient`, `~/hooks/useAuth`.
- Tránh `../../../..` chui nhiều cấp ra ngoài feature — đổi sang alias `~/` cho
  bền khi di chuyển file.

## 5. Bản đồ sở hữu — modal nào thuộc feature nào

| Feature | Modal | Component rải rác cần gom về |
|---|---|---|
| **shared** → `components/common/modal/` | ConfirmModal, ConfirmActionModal, ConfirmDeleteModal | CommonFormModal, ModalActionFooter |
| **profile** → `pages/profile/` | ChangePasswordModal, UpdateProfileModal | |
| **album** → `pages/album-voca/` | CreateAlbumModal, UpdateAlbumModal | `components/vocabulary/*` (Create/Bulk/UpdateVocabularyModal) |
| **myclass** → `pages/myclass/` | CreateChapterModal, UpdateChapterModal, CreateClassModal, EditClassModal, JoinClassModal | `common/`: ClassCard, ClassListContainer, ClassManagementTable, ChapterManagementTable |
| **posts** → `pages/posts/` | CreatePostModal | `components/Comment/` |
| **test/creator** → `pages/mytest/` (hoặc feature `test`) | CreateTestModal, EditTestModal | `components/creator/*`, `common/`: TestCard, TestListContainer, TestManagementTable |
| **question-bank** → `pages/question-bank/` | EditQuestionModal, ViewQuestionModal | |
| **evaluation** → `pages/evaluation/` | EvaluationModal | `components/result/*` |
| **admin** → `admin/modals/` | ExamCategoryFormModal, ExamTypeFormModal, RecoveryResourceFormModal, TagFormModal | `common/AlbumManagementTable` (cần xác minh nơi dùng) |

## 6. Lộ trình di dời (incremental — mỗi batch 1 commit + `npm run build` verify)

Làm từ feature nhỏ/độc lập → cross-cutting để giảm rủi ro. **Không big-bang.**

- [x] **Batch 1 — profile**: ChangePasswordModal, UpdateProfileModal → `pages/profile/modals/`
- [x] **Batch 2 — album**: 2 album modal → `pages/album-voca/modals/`; 3 vocabulary modal → `pages/album-delta/modals/` (co-locate theo importer thật)
- [x] **Batch 3 — posts**: CreatePostModal → `pages/posts/modals/`. (`components/Comment/` để lại — xem mục 7.)
- [x] **Batch 4 — question-bank**: EditQuestionModal, ViewQuestionModal → `pages/question-bank/modals/`
- [x] **Batch 5 — evaluation**: EvaluationModal → `pages/evaluation/modals/`; `result/*` → `pages/exam/.../result/components/` (importer thật là TestResultPage, KHÔNG phải evaluation)
- [x] **Batch 6 — admin**: 4 form modal → `admin/modals/`
- [x] **Batch 7 — myclass**: 5 modal → `pages/myclass/modals/`; ClassCard/ClassListContainer/ClassManagementTable/ChapterManagementTable → `pages/myclass/components/`
- [x] **Batch 8 — test/creator**: gom TẤT CẢ vào `components/test/` (module domain shared, vì dùng chéo exam/myclass/mytest/question-bank/Header): CreateTestModal(+scss), EditTestModal, `creator/*`, TestCard/TestListContainer/TestManagementTable
- [x] **Batch 9 — shared + dọn common/**: Confirm{,Action,Delete}Modal → `components/common/modal/`; AlbumManagementTable → `pages/album-voca/components/`; **`components/modals/` đã xoá hẳn**; `components/common/` còn lại toàn UI generic (BackgroundDecor, MotionSection, PageHeader, modal/)

> **Kết quả**: thùng rác `components/modals/` (31 file) đã giải tán hoàn toàn. Mỗi batch đã `npm run build` xanh.

### Quy trình mỗi batch
1. `git mv` file vào thư mục feature đích.
2. Sửa import nội bộ file vừa chuyển (relative → `~/` nếu chui ra ngoài feature).
3. Cập nhật các file import nó.
4. `grep` xác nhận 0 đường dẫn cũ sót lại.
5. `npm run build` → phải compiled successfully.
6. Commit.

### ⚠️ Hai bẫy đã vấp (đừng lặp lại)
- **Import sibling dạng bare `./X`**: grep theo `oldpath/X` sẽ BỎ SÓT, vì chuỗi import
  không chứa `oldpath/`. Khi tách 2 file từng ở chung 1 thư mục, phải kiểm tra cả
  `./` import giữa chúng (vd `EditTestModal` dùng lại `./EditQuestionModal`).
- **`@import` trong `.module.scss`**: Sass **KHÔNG** hiểu alias `~/` (nó trỏ
  `node_modules`). Mọi `@import '../../GlobalStyles/...'` tương đối sẽ lệch khi đổi
  độ sâu thư mục → phải tính lại relative path. GlobalStyles ở
  `src/components/GlobalStyles/`.
- **Verify build cho đúng**: `cmd > log; echo $?` trả exit của `echo` (luôn 0). Phải
  đọc exit của chính `npm` hoặc `grep "Failed to compile"` trong log.

## 7. Việc cần làm riêng (đã phát hiện, chưa thuộc batch nào)

- `components/Comment/RenderComment.js` import `~/layout/comment/comment.module.scss`
  nhưng thư mục đó **không tồn tại** → import hỏng / dead code. Xử lý khi làm Batch 3.
