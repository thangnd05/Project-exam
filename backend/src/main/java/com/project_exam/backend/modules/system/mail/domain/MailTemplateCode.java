package com.project_exam.backend.modules.system.mail.domain;

/**
 * Mã template được code Java tham chiếu trực tiếp. Mỗi mã phải có một dòng tương ứng
 * trong bảng email_templates (seed ở migration V202608091), vì vậy admin chỉ sửa được
 * nội dung chứ không đổi/xoá được mã.
 */
public final class MailTemplateCode {

    private MailTemplateCode() {}

    /** Khung header/footer bọc ngoài mọi email, chứa {{content}}. */
    public static final String LAYOUT_BASE = "LAYOUT_BASE";

    public static final String WELCOME_REGISTER = "WELCOME_REGISTER";
    public static final String RESET_PASSWORD = "RESET_PASSWORD";
    public static final String PASSWORD_CHANGED = "PASSWORD_CHANGED";
    public static final String EMAIL_CHANGED = "EMAIL_CHANGED";
}
