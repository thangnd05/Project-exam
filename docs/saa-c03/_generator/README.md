# Bộ sinh câu hỏi SAA-C03 (thêm 70 câu cho mỗi tag trong 51 tag)

- `config.js`: 51 tag sau gộp (tên tag khớp DB, domain, tài liệu tham khảo).
- `SPEC.md`: quy cách viết câu (giao cho agent). `tasks/<slug>.md`: đề bài riêng từng tag (Domain 2, 3). Các tag Domain 1, 4 dùng trọng tâm trong prompt ban đầu, xem `config.js` + `SPEC.md`.
- `out/<slug>-1..5.json`: câu đã sinh, mỗi file 14 câu.
- `node validate.js <slug>`: kiểm tra định dạng một tag.
- `node merge.js --status`: tiến độ từng tag.
- `node merge.js --partial`: ghi mọi câu hợp lệ hiện có vào `docs/saa-c03/domain-*.json`.
- `node merge.js --write`: bản cuối (bắt buộc đủ 70 câu/tag, không lỗi, không trùng).

merge.js tự hoán vị đáp án để đáp án đúng chia đều A/B/C/D và sửa nhãn trong giải thích tương ứng.

## Tiếp tục trong session mới
1. `node merge.js --status` để xem tag nào chưa đủ 70 câu.
2. Với mỗi tag thiếu: giao agent "Đọc SPEC.md tại D:/Project-exam/docs/saa-c03/_generator và tasks/<slug>.md, viết tiếp các file out/<slug>-N.json còn thiếu (không ghi đè file đã có)".
3. `node merge.js --write`.
