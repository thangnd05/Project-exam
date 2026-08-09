-- Bỏ nền xám bao ngoài của khung email chung (LAYOUT_BASE).
--
-- Bản seed ở V202608091 bọc email trong một lớp nền #f4f6f8 kèm thẻ trắng bo góc có viền.
-- Nhìn trong hộp thư thì thành hai lớp khung lồng nhau thừa thãi, nên giờ để nền trắng
-- phẳng, chỉ giữ dải màu thương hiệu ở đầu và đường kẻ ngăn phần chân thư.
--
-- Cố ý sửa bằng migration mới thay vì sửa file V202608091: file đó đã chạy trên DB nên
-- đụng vào là Flyway báo lệch checksum và chặn khởi động.
UPDATE emails
SET body_html = $html$<div style="background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:#0d9488;padding:20px 24px;">
      <a href="{{siteUrl}}" style="color:#ffffff;font-size:20px;font-weight:bold;text-decoration:none;">{{siteName}}</a>
    </div>
    <div style="padding:24px;color:#111827;font-size:15px;line-height:1.6;">
      {{content}}
    </div>
    <div style="padding:16px 24px;color:#6b7280;font-size:12px;line-height:1.5;border-top:1px solid #e5e7eb;">
      Email này được gửi tự động từ {{siteName}}, vui lòng không trả lời.<br>
      &copy; {{year}} {{siteName}}
    </div>
  </div>
</div>$html$,
    updated_at = NOW()
WHERE code = 'LAYOUT_BASE';
