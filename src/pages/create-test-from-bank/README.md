# Tạo đề thi từ kho câu hỏi

Trang cho phép tạo đề thi bằng cách **lấy câu hỏi từ kho** (theo phần thi), với 2 chế độ:

- **Chọn thủ công**: Tick từng câu trong danh sách câu hỏi của phần thi.
- **Random theo số lượng**: Nhập số câu, hệ thống lấy ngẫu nhiên đúng số đó từ kho.

## Route

- **Path**: `/admin/create-test-from-bank` (config: `routes.createTestFromBank`)

## API backend cần có

1. **GET** `/api/questions/by-exam-part/:examPartId`  
   Trả về danh sách câu hỏi trong kho thuộc phần thi đó.  
   Response mong đợi: mảng các object có ít nhất `questionId` (hoặc `id`) và `questionText` (hoặc tương đương).  
   Ví dụ: `[{ questionId: 1, questionText: "...", ... }, ...]` hoặc `{ data: [...] }`.

2. **POST** `/api/tests`  
   Tạo đề thi (giống flow hiện tại): body gồm `title`, `examTypeId`, `durationMinutes`, ...

3. **POST** `/api/test-parts`  
   Tạo part cho đề: body `{ testId, examPartId, numQuestions }`.

4. **POST** `/api/test-parts/:testPartId/attach-from-bank`  
   Gắn câu hỏi từ kho vào part.  
   Body: `{ questionIds: [1, 2, 3, ...] }`.

Nếu backend dùng tên endpoint hoặc format khác, chỉnh trực tiếp trong `CreateTestFromBankPage.js` (các đoạn gọi `axios.get`/`axios.post`).
