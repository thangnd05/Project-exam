-- Thư chào mừng trước đây có tiêu đề kiểu quảng cáo, nút kêu gọi bấm,
-- và header khung chung gắn link {{siteUrl}}. Khi chạy local, link đó là
-- http://localhost:3000, Gmail coi là dấu hiệu lừa đảo và đẩy vào thư rác.
--
-- Sửa bằng migration mới vì V202608091 và V202608092 đã chạy, sửa file cũ
-- sẽ làm Flyway lệch checksum.

UPDATE system.emails
SET body_html = $html$<div style="background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <div style="background:#0d9488;padding:20px 24px;">
      <span style="color:#ffffff;font-size:20px;font-weight:bold;">{{siteName}}</span>
    </div>
    <div style="padding:24px;color:#111827;font-size:15px;line-height:1.6;">
      {{content}}
    </div>
    <div style="padding:16px 24px;color:#6b7280;font-size:12px;line-height:1.5;border-top:1px solid #e5e7eb;">
      Bạn nhận email này vì vừa có hoạt động với tài khoản trên {{siteName}}.<br>
      &copy; {{year}} {{siteName}}
    </div>
  </div>
</div>$html$,
    updated_at = NOW()
WHERE code = 'LAYOUT_BASE';

UPDATE system.emails
SET subject = 'Tài khoản {{userName}} trên {{siteName}} đã được tạo',
    body_html = $html$<p>Xin chào {{fullName}},</p>
<p>Tài khoản của bạn trên {{siteName}} đã được tạo và có thể dùng ngay.</p>
<p>Thông tin đăng nhập:</p>
<ul>
  <li>Tên đăng nhập: <b>{{userName}}</b></li>
  <li>Email: {{email}}</li>
</ul>
<p>Bạn đăng nhập lại bằng chính email này trên trang vừa dùng để đăng ký.</p>
<p>Nếu bạn không tạo tài khoản này, hãy bỏ qua email.</p>$html$,
    description = 'Gửi ngay sau khi người dùng đăng ký tài khoản thành công.',
    updated_at = NOW()
WHERE code = 'WELCOME_REGISTER';
