-- ============================================================================
-- Hệ thống email có thể tùy chỉnh nội dung.
--
-- Trước migration này toàn bộ HTML email nằm hardcode trong EmailUtil.java, muốn
-- sửa một chữ cũng phải build lại backend. Sau migration chỉ cần 2 bảng:
--
--   emails             một dòng là một nội dung email.
--                       type = AUTO   : mẫu gắn với sự kiện (đăng ký, đổi mật khẩu...),
--                                       có `code` cố định để code Java gọi tới.
--                       type = MANUAL : nội dung admin soạn tay để gửi cho người dùng.
--   email_recipients   một dòng là một lần gửi tới một người: email_id + user_id +
--                       trạng thái gửi. Dùng chung cho cả AUTO lẫn MANUAL nên nhật ký
--                       và chức năng gửi lại chỉ có một đường duy nhất.
--
-- Cố ý KHÔNG có cột "nhóm người nhận" (tất cả / theo vai trò / premium): admin chọn
-- người nhận ngay trên giao diện rồi gửi xuống danh sách userId, lọc theo vai trò là
-- việc của frontend.
--
-- Quy ước template: nội dung dùng placeholder {{tenBien}}, renderer thay bằng giá trị
-- thật lúc gửi. Dòng AUTO có code LAYOUT_BASE là khung bọc ngoài (header/footer) chứa
-- {{content}}  sửa một chỗ là đổi giao diện toàn bộ email.
--
-- `code` do code Java tham chiếu (MailTemplateCode) nên admin KHÔNG được đổi/xoá dòng
-- AUTO, chỉ sửa được subject + body_html + active.
-- ============================================================================

CREATE TABLE emails (
    email_id        character varying(255) NOT NULL,
    type            character varying(16) NOT NULL,
    code            character varying(64),
    name            character varying(150),
    description     character varying(500),
    subject         text NOT NULL,
    body_html       text NOT NULL,
    available_vars  character varying(500),
    active          boolean NOT NULL DEFAULT true,
    created_by      character varying(255),
    created_at      timestamp(6) with time zone NOT NULL,
    updated_at      timestamp(6) with time zone NOT NULL,
    updated_by      character varying(255),
    CONSTRAINT emails_pkey PRIMARY KEY (email_id),
    CONSTRAINT emails_type_check CHECK (type IN ('AUTO', 'MANUAL')),
    -- Chỉ dòng AUTO mới có code, và code là duy nhất (unique bỏ qua NULL).
    CONSTRAINT emails_code_only_auto CHECK ((type = 'AUTO') = (code IS NOT NULL)),
    CONSTRAINT uk_emails_code UNIQUE (code)
);

-- Chỉ lưu "gửi cái gì, cho ai, kết quả ra sao"  nội dung luôn dựng từ emails lúc gửi
-- nên không nhân bản cùng một khối HTML ra hàng nghìn dòng.
--
-- to_email lưu riêng chứ không suy từ users.email: mail cảnh báo đổi email phải gửi về
-- địa chỉ CŨ, lúc ghi log thì users.email đã là địa chỉ mới.
CREATE TABLE email_recipients (
    recipient_id    character varying(255) NOT NULL,
    email_id        character varying(255) NOT NULL,
    user_id         character varying(255),
    to_email        character varying(255) NOT NULL,
    status          character varying(20) NOT NULL,
    error_message   text,
    created_at      timestamp(6) with time zone NOT NULL,
    sent_at         timestamp(6) with time zone,
    CONSTRAINT email_recipients_pkey PRIMARY KEY (recipient_id),
    CONSTRAINT email_recipients_status_check CHECK (status IN ('PENDING', 'SENT', 'FAILED'))
);

ALTER TABLE ONLY emails
    ADD CONSTRAINT fk_emails_created_by FOREIGN KEY (created_by)
    REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE ONLY emails
    ADD CONSTRAINT fk_emails_updated_by FOREIGN KEY (updated_by)
    REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE ONLY email_recipients
    ADD CONSTRAINT fk_email_recipients_email_id FOREIGN KEY (email_id)
    REFERENCES emails(email_id) ON DELETE CASCADE;

ALTER TABLE ONLY email_recipients
    ADD CONSTRAINT fk_email_recipients_user_id FOREIGN KEY (user_id)
    REFERENCES public.users(user_id) ON DELETE SET NULL;

-- Index cho các cột khoá ngoại (Postgres không tự tạo).
CREATE INDEX idx_emails_created_by ON emails USING btree (created_by);
CREATE INDEX idx_emails_updated_by ON emails USING btree (updated_by);
CREATE INDEX idx_email_recipients_email_id ON email_recipients USING btree (email_id);
CREATE INDEX idx_email_recipients_user_id ON email_recipients USING btree (user_id);

-- ---------------------------------------------------------------------------
-- Seed mẫu AUTO. Nội dung bê nguyên tinh thần bản hardcode cũ trong EmailUtil.java,
-- đổi sang tông teal cho khớp giao diện hiện tại.
-- ---------------------------------------------------------------------------

INSERT INTO emails (email_id, type, code, name, description, subject, body_html, available_vars, active, created_at, updated_at)
VALUES (
    '019853a0-0000-7000-8000-000000000001',
    'AUTO',
    'LAYOUT_BASE',
    'Khung email chung',
    'Header + footer bọc ngoài mọi email. Vị trí {{content}} là nơi nội dung từng email được chèn vào.',
    '{{siteName}}',
$html$<div style="background:#f4f6f8;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0d9488;padding:20px 24px;">
      <a href="{{siteUrl}}" style="color:#ffffff;font-size:20px;font-weight:bold;text-decoration:none;">{{siteName}}</a>
    </div>
    <div style="padding:24px;color:#111827;font-size:15px;line-height:1.6;">
      {{content}}
    </div>
    <div style="padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px;line-height:1.5;border-top:1px solid #e5e7eb;">
      Email này được gửi tự động từ {{siteName}}, vui lòng không trả lời.<br>
      &copy; {{year}} {{siteName}}
    </div>
  </div>
</div>$html$,
    'content, siteName, siteUrl, year',
    true,
    NOW(),
    NOW()
);

INSERT INTO emails (email_id, type, code, name, description, subject, body_html, available_vars, active, created_at, updated_at)
VALUES (
    '019853a0-0000-7000-8000-000000000002',
    'AUTO',
    'WELCOME_REGISTER',
    'Chào mừng khi đăng ký',
    'Gửi ngay sau khi người dùng đăng ký tài khoản thành công.',
    'Chào mừng bạn đến với {{siteName}}!',
$html$<h2 style="color:#0f766e;margin:0 0 12px;">Xin chào {{fullName}}!</h2>
<p>Tài khoản <b>{{userName}}</b> đã được tạo thành công và có thể sử dụng ngay, bạn không cần xác thực thêm bước nào.</p>
<div style="margin:24px 0;">
  <a href="{{loginUrl}}" style="background:#0d9488;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block;">Bắt đầu học ngay</a>
</div>
<p style="color:#6b7280;font-size:13px;">Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email.</p>$html$,
    'fullName, userName, email, loginUrl, siteName, siteUrl, year',
    true,
    NOW(),
    NOW()
);

INSERT INTO emails (email_id, type, code, name, description, subject, body_html, available_vars, active, created_at, updated_at)
VALUES (
    '019853a0-0000-7000-8000-000000000003',
    'AUTO',
    'RESET_PASSWORD',
    'Đặt lại mật khẩu',
    'Gửi khi người dùng bấm quên mật khẩu. Bắt buộc giữ {{actionUrl}}, thiếu là người dùng không đặt lại được.',
    'Đặt lại mật khẩu {{siteName}}',
$html$<h2 style="color:#0f766e;margin:0 0 12px;">Yêu cầu đặt lại mật khẩu</h2>
<p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Bấm nút bên dưới để tiếp tục:</p>
<div style="margin:24px 0;">
  <a href="{{actionUrl}}" style="background:#0d9488;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block;">Đặt lại mật khẩu</a>
</div>
<p style="color:#6b7280;font-size:13px;">Liên kết có hiệu lực trong {{expireMinutes}} phút. Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email.</p>$html$,
    'fullName, actionUrl, expireMinutes, siteName, siteUrl, year',
    true,
    NOW(),
    NOW()
);

INSERT INTO emails (email_id, type, code, name, description, subject, body_html, available_vars, active, created_at, updated_at)
VALUES (
    '019853a0-0000-7000-8000-000000000004',
    'AUTO',
    'PASSWORD_CHANGED',
    'Cảnh báo đổi mật khẩu',
    'Gửi sau khi mật khẩu đổi thành công (tự đổi hoặc qua quên mật khẩu).',
    'Mật khẩu {{siteName}} của bạn vừa được thay đổi',
$html$<h2 style="color:#0f766e;margin:0 0 12px;">Mật khẩu vừa được thay đổi</h2>
<p>Xin chào {{fullName}}, mật khẩu tài khoản của bạn đã được thay đổi lúc <b>{{changedAt}}</b>.</p>
<p>Mọi phiên đăng nhập cũ đã bị đăng xuất.</p>
<p style="color:#b91c1c;font-size:13px;">Nếu không phải bạn thực hiện, hãy dùng chức năng quên mật khẩu để lấy lại tài khoản ngay.</p>$html$,
    'fullName, changedAt, siteName, siteUrl, year',
    true,
    NOW(),
    NOW()
);

INSERT INTO emails (email_id, type, code, name, description, subject, body_html, available_vars, active, created_at, updated_at)
VALUES (
    '019853a0-0000-7000-8000-000000000005',
    'AUTO',
    'EMAIL_CHANGED',
    'Cảnh báo đổi email',
    'Gửi tới CẢ email cũ lẫn email mới khi người dùng đổi địa chỉ email.',
    'Email đăng nhập {{siteName}} vừa được thay đổi',
$html$<h2 style="color:#0f766e;margin:0 0 12px;">Email đăng nhập vừa được thay đổi</h2>
<p>Xin chào {{fullName}}, email tài khoản của bạn đã đổi lúc <b>{{changedAt}}</b>:</p>
<p style="background:#f3f4f6;padding:12px 16px;border-radius:8px;">
  Email cũ: <b>{{oldEmail}}</b><br>
  Email mới: <b>{{newEmail}}</b>
</p>
<p style="color:#b91c1c;font-size:13px;">Nếu không phải bạn thực hiện, hãy liên hệ quản trị viên ngay.</p>$html$,
    'fullName, oldEmail, newEmail, changedAt, siteName, siteUrl, year',
    true,
    NOW(),
    NOW()
);
