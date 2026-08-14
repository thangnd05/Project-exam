package com.project_exam.backend.infrastructure.security;

import com.project_exam.backend.shared.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Xác minh token reCAPTCHA với Google.
 *
 * Bắt buộc phải kiểm ở backend: token do trình duyệt gửi lên, bot hoàn toàn có thể gọi
 * thẳng API đăng ký và bỏ qua widget, chỉ có bước đối chiếu với Google mới chặn được.
 */
@Slf4j
@Service
public class RecaptchaService {

    private static final String VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

    private final RestTemplate restTemplate = new RestTemplate();

    /** Tắt mặc định để máy dev chưa có khóa vẫn đăng ký được. */
    @Value("${app.recaptcha.enabled:false}")
    private boolean enabled;

    @Value("${app.recaptcha.secret:}")
    private String secretKey;

    public void verify(String token) {
        if (!enabled) {
            return;
        }
        if (secretKey == null || secretKey.isBlank()) {
            log.warn("Đã bật reCAPTCHA nhưng thiếu app.recaptcha.secret  bỏ qua bước xác minh");
            return;
        }
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Vui lòng xác nhận bạn không phải là người máy.");
        }

        if (!callGoogle(token)) {
            throw new BadRequestException(
                    "Xác minh reCAPTCHA thất bại. Vui lòng thử lại.");
        }
    }

    private boolean callGoogle(String token) {
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("secret", secretKey);
            form.add("response", token);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            @SuppressWarnings("unchecked")
            Map<String, Object> body = restTemplate.postForObject(
                    VERIFY_URL, new HttpEntity<>(form, headers), Map.class);

            if (body == null) {
                return false;
            }
            boolean success = Boolean.TRUE.equals(body.get("success"));
            if (!success) {
                log.info("Google từ chối token reCAPTCHA: {}", body.get("error-codes"));
            }
            return success;
        } catch (Exception e) {
            // Google lỗi mạng thì không chặn người dùng thật lại; ghi log để còn biết.
            log.warn("Không gọi được dịch vụ xác minh reCAPTCHA: {}", e.getMessage());
            return true;
        }
    }
}
