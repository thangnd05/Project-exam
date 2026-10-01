# Spec: viết 70 câu hỏi luyện thi AWS SAA-C03 cho MỘT tag

Thư mục làm việc (gọi là SCRATCH): `D:/Project-exam/docs/saa-c03/_generator`

Bạn được giao một tag (slug, tên tag, domain, tài liệu). Nhiệm vụ: viết **70 câu hỏi mới** chất lượng thi thật cho đúng tag đó, dùng để người học luyện tập.

## Bước làm

1. Đọc **toàn bộ** tài liệu của tag (đường dẫn trong prompt). Đọc `SCRATCH/sample.json` để thấy văn phong mẫu (lấy từ bộ DOP-C02: đề tiếng Anh, giải thích tiếng Việt).
2. Đọc `SCRATCH/existing/<slug>.txt`: đầu các câu **đã có** trong ngân hàng. **Không** viết lại các kịch bản này (không đổi vài chữ rồi dùng lại). Chọn góc hỏi, ràng buộc, dịch vụ nhiễu khác đi.
3. Lập kế hoạch phủ chủ đề (trong đầu, không cần ghi file): liệt kê 15–25 khía cạnh của tag (tính năng, giới hạn, cách tích hợp, bẫy, so sánh dịch vụ dễ nhầm). Rải 70 câu cho đều, không để 1 khía cạnh chiếm quá 6 câu. Nếu tag gộp nhiều dịch vụ (vd `IAM / AWS-STS`, `Threat-Detection`), chia câu tương đối đều giữa các dịch vụ trong nhóm và có nhiều câu buộc phân biệt các dịch vụ cùng nhóm.
4. Viết 5 file, mỗi file đúng **14 câu**: `SCRATCH/out/<slug>-1.json` … `SCRATCH/out/<slug>-5.json`. Mỗi file là một **JSON array** các câu hỏi (định dạng bên dưới). Viết xong file nào chạy luôn kiểm tra.
5. Chạy `node "SCRATCH/validate.js" <slug>` và sửa tới khi báo `OK`. Validate đếm trên tất cả file của slug.
6. Trả về báo cáo **ngắn** (≤ 6 dòng): số câu, phân bố level/type, kết quả validate, điểm nào bạn không chắc chắn về mặt kỹ thuật (nếu có). Không dán nội dung câu hỏi vào báo cáo.

## Cơ cấu mỗi file 14 câu

- Level: **4 `basic`**, **6 `intermediate`**, **4 `advanced`** (tổng 70 câu: 20 / 30 / 20).
- Type: **11 MCQ + 3 MSQ** (tổng 55 MCQ, 15 MSQ). Trong 15 MSQ: khoảng 12 câu "Which TWO" (5 đáp án, 2 đúng) và 3 câu "Which THREE" (6 đáp án, 3 đúng).

Ý nghĩa level:
- `basic`: câu nền tảng cho người mới học. Kịch bản ngắn (1–3 câu), hỏi một khái niệm cốt lõi: dịch vụ nào làm việc X, tính năng nào giải quyết Y, giới hạn/đặc tính quan trọng. Đáp án nhiễu vẫn phải hợp lý (dịch vụ AWS có thật, liên quan), không được lộ liễu.
- `intermediate`: kịch bản SAA điển hình (3–5 câu), 1–2 ràng buộc (chi phí, vận hành ít nhất, HA, bảo mật), cần chọn đúng dịch vụ/cấu hình.
- `advanced`: kịch bản nhiều ràng buộc (4–7 câu), các đáp án đều khả thi về kỹ thuật, chỉ một cái thỏa **tất cả** ràng buộc; bẫy tinh tế (least operational overhead, giới hạn dịch vụ, khác Region/account, chi phí ẩn).

## Định dạng một câu hỏi

```json
{
  "questionType": "MCQ",
  "level": "intermediate",
  "questionText": "English scenario ... Which solution meets these requirements with the LEAST operational overhead?",
  "explanation": "Phân tích đề: ...\n(A) SAI: ...\n(B) ĐÚNG: ...\n(C) SAI: ...\n(D) SAI: ...\nĐáp án đúng: B\nĐiểm cần nhớ: ...",
  "answers": [
    { "answerLabel": "A", "answerText": "...", "isCorrect": false },
    { "answerLabel": "B", "answerText": "...", "isCorrect": true },
    { "answerLabel": "C", "answerText": "...", "isCorrect": false },
    { "answerLabel": "D", "answerText": "...", "isCorrect": false }
  ]
}
```

Chỉ dùng đúng các trường: `questionType`, `level`, `questionText`, `explanation`, `answers` (mỗi answer: `answerLabel`, `answerText`, `isCorrect`). **Không** thêm `questionNumber`, `tagNames` (script ghép sẽ tự thêm).

### questionText, answerText (tiếng Anh)
- Tiếng Anh chuẩn văn phong đề AWS: "A company…", "A solutions architect must…", kết thúc bằng câu hỏi rõ ràng ("Which solution meets these requirements?", "…MOST cost-effectively?", "…with the LEAST operational overhead?").
- MSQ phải ghi rõ "Which TWO …" hoặc "Which THREE …" (viết hoa TWO/THREE), khớp số đáp án đúng.
- Đáp án là mô tả giải pháp đầy đủ, 1 câu, độ dài **tương đương nhau**. Đáp án đúng **không** được thường xuyên dài nhất/chi tiết nhất (validate cảnh báo nếu > 40% câu MCQ có đáp án đúng dài nhất). Không dùng "All of the above"/"None of the above".
- Đáp án nhiễu phải hợp lý: dùng dịch vụ có thật, sai vì một lý do cụ thể (vi phạm một ràng buộc, không hỗ trợ tính năng đó, tốn vận hành hơn, đắt hơn…). Không bịa tính năng không tồn tại để làm đáp án đúng.
- Không nhắc nhãn đáp án (A/B/C…) trong questionText.
- Dùng tên dịch vụ hiện hành (2025–2026): IAM Identity Center (không dùng "AWS SSO" trừ khi giải thích tên cũ), Amazon Data Firehose (tên mới của Kinesis Data Firehose), AWS Fault Injection Service, Amazon OpenSearch Service, v.v. Thông số kỹ thuật (giới hạn, SLA, thời gian retrieval, số AZ…) phải chính xác; không chắc thì đừng đưa con số vào.

### explanation (tiếng Việt, thuật ngữ AWS giữ tiếng Anh)
Các dòng cách nhau bằng `\n`, đúng thứ tự:
1. `Phân tích đề: ` – tóm tắt ràng buộc then chốt, từ khóa quyết định.
2. Mỗi đáp án một dòng, liền nhau, theo thứ tự nhãn: `(A) SAI: …` / `(B) ĐÚNG: …`. Mỗi dòng giải thích **vì sao** đúng/sai cụ thể (không chỉ "không phù hợp"). Dòng ĐÚNG giải thích cơ chế hoạt động.
3. `Đáp án đúng: B` (MCQ) · `Đáp án đúng: B và E` (MSQ 2 đáp án) · `Đáp án đúng: A, C và E` (MSQ 3 đáp án).
4. `Điểm cần nhớ: ` – 1–2 câu quy tắc/mẹo thi để người học nhớ.

**Quan trọng (script sẽ tự hoán vị thứ tự đáp án để cân bằng A/B/C/D):**
- Trong nội dung giải thích **không bao giờ** nhắc tới đáp án bằng chữ cái (không viết "khác với B", "phương án A", "(C) cũng…", "A và D"). Muốn đối chiếu thì gọi theo nội dung ("khác với phương án dùng NAT Gateway…").
- Chỉ dùng nhãn ở đầu các dòng `(X) ĐÚNG|SAI:` và dòng `Đáp án đúng:`.
- Bạn vẫn nên tự rải đáp án đúng đều trên các nhãn, nhưng không cần hoàn hảo.

## Chống lộ đáp án (bắt buộc)
- **Độ dài:** trong mỗi file, đáp án đúng là dài nhất ở **tối đa 3/11** câu MCQ. Ở ít nhất 4 câu MCQ, đáp án đúng phải **ngắn nhất hoặc ngắn thứ hai**. Ít nhất một đáp án nhiễu luôn chi tiết ngang hoặc hơn đáp án đúng (thêm cấu hình cụ thể, tên tính năng có thật).
- **Đáp án nhiễu gây đánh lừa:** mỗi câu intermediate/advanced có ít nhất 1 đáp án "gần đúng" (giải quyết được phần lớn yêu cầu nhưng hỏng đúng 1 ràng buộc: sai Region/AZ, không đáp ứng RPO/RTO, tốn vận hành hơn, đắt hơn, vượt giới hạn dịch vụ, cần đổi code trong khi đề cấm…). Dùng các bẫy kinh điển của SAA: dịch vụ tên giống nhau, tính năng có thật nhưng sai ngữ cảnh, giải pháp thừa (over-engineered), giải pháp tự xây thay vì managed.
- Không để từ khóa trong đề lặp nguyên văn **chỉ** ở đáp án đúng; đáp án nhiễu cũng dùng từ vựng của đề.
- Không dùng từ tuyệt đối (always/never/only) làm dấu hiệu chỉ có ở đáp án sai.
- Chạy `node validate.js <slug>`: dòng "MCQ có đáp án đúng dài nhất" phải ≤ 30% số MCQ của các file bạn viết.

## JSON
- File phải là JSON hợp lệ UTF-8. Xuống dòng trong explanation viết `\n` trong chuỗi JSON. Dấu ngoặc kép bên trong chuỗi phải escape `\"` (tốt nhất tránh dùng ngoặc kép trong nội dung, dùng nháy đơn).
- Mỗi file 14 câu; tổng 5 file = 70 câu.
