-- V202610011 đã chạy với thân thư chào mừng ngắn. Bổ sung đủ thông tin tài khoản
-- (tên đăng nhập, email, cách đăng nhập lại) mà không gắn nút hay link localhost.

UPDATE system.emails
SET body_html = $html$<p>Xin chào {{fullName}},</p>
<p>Tài khoản của bạn trên {{siteName}} đã được tạo và có thể dùng ngay.</p>
<p>Thông tin đăng nhập:</p>
<ul>
  <li>Tên đăng nhập: <b>{{userName}}</b></li>
  <li>Email: {{email}}</li>
</ul>
<p>Bạn đăng nhập lại bằng chính email này trên trang vừa dùng để đăng ký.</p>
<p>Nếu bạn không tạo tài khoản này, hãy bỏ qua email.</p>$html$,
    updated_at = NOW()
WHERE code = 'WELCOME_REGISTER';
