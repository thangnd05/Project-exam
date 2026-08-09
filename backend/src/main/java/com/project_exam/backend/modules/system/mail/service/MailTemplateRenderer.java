package com.project_exam.backend.modules.system.mail.service;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Thay placeholder {{tenBien}} trong template bằng giá trị thật.
 *
 * Cố ý KHÔNG dùng Thymeleaf/SpEL: nội dung template do admin nhập, một engine có khả
 * năng gọi method sẽ biến ô soạn thảo thành lỗ hổng thực thi code. Ở đây chỉ có phép
 * thay chuỗi thuần.
 */
@Component
public class MailTemplateRenderer {

    private static final Pattern VARIABLE = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_]+)\\s*}}");

    public String render(String template, Map<String, String> variables) {
        if (template == null || template.isBlank()) {
            return "";
        }
        Matcher matcher = VARIABLE.matcher(template);
        StringBuilder result = new StringBuilder();
        while (matcher.find()) {
            String value = variables.get(matcher.group(1));
            // Biến không khai báo được giữ nguyên dạng {{ten}} để admin nhìn thấy mình gõ sai,
            // thay vì âm thầm biến mất trong email đã gửi đi.
            matcher.appendReplacement(result, Matcher.quoteReplacement(value != null ? value : matcher.group(0)));
        }
        matcher.appendTail(result);
        return result.toString();
    }
}
