# Import câu hỏi từ file JSON

Đường import thứ hai bên cạnh import file Word. File Word phải *đoán* cấu trúc bằng regex; JSON thì khai báo tường minh nên không có bước suy diễn nào có thể sai.

File mẫu: [question-import-sample.json](question-import-sample.json) (đầy đủ các loại câu hỏi) và
[question-import-sample-minimal.json](question-import-sample-minimal.json) (dạng ngắn nhất).

## Endpoint

| Method | Path | Mô tả |
| --- | --- | --- |
| POST | `/api/questions/preview/json` | Dry-run: kiểm tra và trả về dữ liệu đã chuẩn hoá, **không ghi database** |
| POST | `/api/questions/import/json` | Tạo câu hỏi vào ngân hàng đề |

Cả hai nhận 2 kiểu body:

- `Content-Type: application/json` - dán trực tiếp nội dung JSON.
- `Content-Type: multipart/form-data` với part `file` - upload file `.json` (tối đa 5MB).

Query param của `/import/json`: `examPartId`, `classId`, `chapterId`, `usageScope`.
**Param trên URL được ưu tiên hơn giá trị trong file**, nên một file JSON dùng lại được cho nhiều
part hoặc nhiều lớp. `examPartId` là bắt buộc (từ param hoặc từ file).

```bash
# Kiểm tra trước
curl -X POST http://localhost:8080/api/questions/preview/json \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@docs/question-import-sample.json"

# Import thật
curl -X POST "http://localhost:8080/api/questions/import/json?examPartId=<id>" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@docs/question-import-sample.json"
```

## Cấu trúc file

```jsonc
{
  "version": 1,                  // tùy chọn
  "examPartId": "...",           // tùy chọn, param URL ưu tiên hơn
  "classId": "...",              // tùy chọn
  "chapterId": "...",            // tùy chọn
  "usageScope": "EXAM",          // EXAM | PRACTICE, mặc định EXAM

  "questions": [ /* câu hỏi độc lập */ ],
  "groups":    [ /* câu hỏi theo đoạn văn / bài nghe */ ]
}
```

Cần **ít nhất một** trong `questions` / `groups`; có thể dùng cả hai trong cùng một file.

### Câu hỏi

| Trường | Bắt buộc | Ghi chú |
| --- | --- | --- |
| `questionText` (alias `text`) | có | Không được để trống |
| `questionType` (alias `type`) | không | `MCQ` \| `MSQ` \| `FILL_BLANK` \| `ESSAY`. Bỏ trống sẽ được suy ra |
| `answers` | tùy loại | Tối đa 10 đáp án |
| `explanation` | không | Lời giải |
| `tagNames` (alias `tags`) | không | Tag chưa có sẽ được tạo theo exam type của part |
| `tagIds` | không | Dùng khi đã biết id tag |
| `collectionId` | không | |
| `questionNumber` (alias `number`) | không | Số nguyên dương; là **offset** tính từ câu lớn nhất đang có trong ngân hàng, không phải số thứ tự tuyệt đối |

### Đáp án

| Trường | Bắt buộc | Ghi chú |
| --- | --- | --- |
| `answerText` (alias `text`) | có với MCQ/MSQ | |
| `isCorrect` (alias `correct`) | tùy loại | Bỏ trống = `false` |
| `answerLabel` (alias `label`) | không | Bỏ trống thì gán tự động `A`, `B`, `C`... theo thứ tự |

### Nhóm theo đoạn văn / bài nghe

```jsonc
{
  "passage": {
    "passageType": "READING",        // READING | LISTENING, mặc định READING
    "content": "...",                // nội dung đoạn văn
    "contentTranslation": "...",     // tùy chọn
    "mediaUrl": "https://...",       // tùy chọn, audio/ảnh đã upload sẵn
    "extraContents": ["..."]         // tùy chọn, lưu thành media dạng TEXT
  },
  "questions": [ /* ... */ ]
}
```

Passage phải có ít nhất một trong `content` / `mediaUrl` / `extraContents`, và nhóm phải có ít nhất
1 câu hỏi. Import JSON **không upload được file media** - dùng `mediaUrl` của file đã có trên
Cloudinary, hoặc thêm media sau qua màn hình sửa câu hỏi.

## Luật kiểm tra

Sai một chỗ thì **cả file bị từ chối** (import chạy trong một transaction), và response liệt kê
*tất cả* lỗi kèm đường dẫn tới đúng vị trí, ví dụ `groups[1].questions[0].answers[2].answerText`.

- Tên trường lạ (ví dụ gõ sai `isCorect`) -> lỗi, kèm danh sách trường được phép. Không có chuyện
  sai chính tả rồi bị bỏ qua âm thầm.
- `MCQ`: >= 2 đáp án, **đúng 1** đáp án `isCorrect: true`.
- `MSQ`: >= 2 đáp án, >= 1 đáp án đúng (chỉ có 1 đáp án đúng thì cảnh báo).
- `FILL_BLANK`: >= 1 đáp án; không đánh dấu đáp án đúng thì coi tất cả là đáp án được chấp nhận.
- `ESSAY`: đáp án không bắt buộc; nếu có, chỉ đáp án đầu tiên được lưu làm bài mẫu.
- Nhãn đáp án trùng nhau trong cùng một câu -> lỗi.

Suy ra `questionType` khi bỏ trống: không có đáp án -> `ESSAY`; >= 2 đáp án đúng -> `MSQ`;
còn lại -> `MCQ`. Mỗi lần suy ra đều kèm một cảnh báo trong `warnings`.

## Tạo trọn một đề từ JSON (nhiều phần thi)

Trên UI: modal **Khởi tạo bài thi** > tab **Tạo đề thi**, chọn **Loại kỳ thi** (không cần chọn phần
thi), nhập tiêu đề rồi upload file vào ô *"Hoặc tạo trọn đề từ file JSON"*. Màn hình hiện bảng số câu
theo từng phần thi, kèm cảnh báo tag không khớp; bấm tạo đề là xong.

| Method | Path | Mô tả |
| --- | --- | --- |
| POST | `/api/tests/import/json/preview?examTypeId=<id>` | Dry-run: số câu mỗi phần thi, lỗi, cảnh báo tag không khớp |
| POST | `/api/tests/import/json?usageScope=EXAM` | Tạo đề, tạo câu hỏi và gắn vào đề trong **một transaction**. Câu chỉ thuộc đề, không vào kho (giống nhập tay) |

Cả hai nhận `multipart/form-data`: part `file` là file JSON. Endpoint import thêm part `request` là
JSON của thông tin đề (`title`, `examTypeId`, `durationMinutes`, `collectionId`... giống `POST /api/tests`).

File dùng đúng format ở trên. Phần thi của mỗi câu xác định theo thứ tự:

1. `examPart` (alias `part`) của câu: tên phần thi (không phân biệt hoa thường) hoặc id.
2. Với nhóm passage: `examPart` của nhóm. Nếu nhóm không khai báo thì mọi câu trong nhóm phải chỉ về cùng một phần thi.
3. Tiền tố tag dạng `"Phần thi > Tag"`, ví dụ `"Secure Architectures > IAM / AWS-STS (...)"`.
4. Loại kỳ thi chỉ có một phần thi thì mọi câu thuộc phần đó.

Câu không xác định được phần thi, `examPart` sai tên, hay tag của một câu chỉ về nhiều phần thi
khác nhau đều bị báo lỗi kèm vị trí. Mỗi phần thi có câu sẽ thành một part của đề, xếp theo thứ tự
hiển thị của phần thi. Trong part, câu giữ thứ tự trong file (câu độc lập trước, nhóm sau). Tag
được tìm trong đúng phần thi của câu; tag chưa có trong hệ thống bị bỏ qua và được liệt kê ở preview.

Ví dụ: [saa-c03/exam-sample-65.json](saa-c03/exam-sample-65.json) là đề 65 câu lấy từ 4 file domain SAA-C03.
Không giới hạn số câu, chỉ giới hạn 5MB mỗi file.

## Round-trip với file Word

Tên trường của JSON trùng với output của `/api/questions/preview/document`, nên quy trình chữa
cháy cho file Word khó parse là:

1. `POST /preview/document` với file `.docx` -> nhận `NormalQuestionRequest[]`.
2. Bọc mảng đó vào `{ "questions": [...] }`, lưu thành `.json`.
3. Sửa tay những câu parser đọc sai.
4. `POST /import/json`.

Các trường chỉ có ý nghĩa với preview (`needsManualCorrect`, `answerId`, `questionId`) được chấp
nhận rồi bỏ qua, nên không cần dọn file trước khi import.

Test `QuestionJsonImportServiceTest` kiểm tra cả hai file mẫu trong thư mục này, nên khi format đổi
mà file mẫu không đổi theo thì test sẽ đỏ.
