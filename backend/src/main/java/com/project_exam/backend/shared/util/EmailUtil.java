package com.project_exam.backend.shared.util;

import com.project_exam.backend.shared.exception.BadRequestException;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.io.UnsupportedEncodingException;

@Component
@RequiredArgsConstructor
public class EmailUtil {

    private final JavaMailSender javaMailSender;

    @Value("${app.mail.from-address}")
    private String fromAddress;

    @Value("${app.mail.from-name}")
    private String fromName;

    @Value("${app.mail.site-name}")
    private String siteName;

    @Value("${app.frontend.origin}")
    private String frontendOrigin;

    public void sendVerificationEmail(String email, String token) throws MessagingException {
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

        try {
            helper.setFrom(fromAddress, fromName);
        } catch (UnsupportedEncodingException e) {
            helper.setFrom(fromAddress);
        }
        helper.setTo(email);
        helper.setSubject("Xác thực tài khoản " + siteName);

        String content = """
            <div style="font-family:Arial, sans-serif; background:#f9f9f9; padding:20px; border-radius:10px;">
                <h2 style="color:#2c3e50;">Xin chào!</h2>
                <p style="font-size:16px; color:#333;">
                    Cảm ơn bạn đã đăng ký tài khoản tại <b>%s</b>.<br>
                    Vui lòng ấn vào nút bên dưới để xác thực tài khoản của bạn:
                </p>
                <div style="margin:25px 0;">
                    <a href="%s/verify?token=%s"
                       style="background-color:#00c6ff; color:white; text-decoration:none;
                              padding:12px 20px; border-radius:8px; font-weight:bold;">
                        Xác thực ngay
                    </a>
                </div>
                <p style="color:#666; font-size:13px;">
                    Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.<br><br>
                    Trân trọng,<br>
                    <b>Đội ngũ %s</b>
                </p>
            </div>
        """.formatted(siteName, frontendOrigin, token, siteName);

        helper.setText(content, true);

        try {
            javaMailSender.send(mimeMessage);
        } catch (MailException e) {
            throw new BadRequestException("Không thể gửi email xác thực. Vui lòng kiểm tra địa chỉ email.");
        }
    }

    public void sendResetPasswordEmail(String email, String token) {
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        MimeMessageHelper helper;
        try {
            helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            try {
                helper.setFrom(fromAddress, fromName);
            } catch (UnsupportedEncodingException e) {
                helper.setFrom(fromAddress);
            }
            helper.setTo(email);
            helper.setSubject("Đặt lại mật khẩu " + siteName);

            String content = """
                <div style="font-family:Arial, sans-serif; background:#f9f9f9; padding:20px; border-radius:10px;">
                    <h2 style="color:#2c3e50;">Yêu cầu đặt lại mật khẩu</h2>
                    <p style="font-size:16px; color:#333;">
                        Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.<br>
                        Vui lòng nhấn nút bên dưới để tiếp tục:
                    </p>
                    <div style="margin:25px 0;">
                        <a href="%s/reset?token=%s"
                           style="background-color:#ff7a18; color:white; text-decoration:none;
                                  padding:12px 20px; border-radius:8px; font-weight:bold;">
                            Đặt lại mật khẩu
                        </a>
                    </div>
                    <p style="color:#666; font-size:13px;">
                        Liên kết có hiệu lực trong 30 phút.<br>
                        Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email.<br><br>
                        Trân trọng,<br>
                        <b>Đội ngũ %s</b>
                    </p>
                </div>
            """.formatted(frontendOrigin, token, siteName);

            helper.setText(content, true);
            javaMailSender.send(mimeMessage);
        } catch (Exception e) {
            throw new BadRequestException("Không thể gửi email đặt lại mật khẩu.");
        }
    }
}
