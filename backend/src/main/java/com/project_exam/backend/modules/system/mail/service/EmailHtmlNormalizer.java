package com.project_exam.backend.modules.system.mail.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Attribute;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Biến HTML của trình soạn thảo thành HTML chạy được trong hộp thư.
 *
 * Trình soạn thảo (Quill) xuất ra HTML ngữ nghĩa kèm class riêng  ví dụ
 * {@code <p class="ql-align-center">}  trong khi email client bỏ qua CSS ngoài và phần
 * lớn không đọc cả thẻ {@code <style>}; muốn hiển thị đúng thì mọi định dạng phải nằm ở
 * thuộc tính style ngay trên thẻ. Lớp này làm đúng việc đó: dịch class của editor thành
 * style inline và gắn style mặc định cho các thẻ thường gặp.
 *
 * Nguyên tắc: KHÔNG đè style tác giả đã tự viết. Thẻ nào đã có {@code style} thì giữ
 * nguyên, nhờ vậy các mẫu viết tay (nút bấm, khung màu) không bị phá khi đi qua đây.
 */
@Component
public class EmailHtmlNormalizer {

    /** Style mặc định gắn cho thẻ chưa có style riêng. */
    private static final Map<String, String> DEFAULT_STYLES = Map.ofEntries(
            Map.entry("h1", "font-size:24px;font-weight:bold;color:#0f766e;margin:0 0 12px;"),
            Map.entry("h2", "font-size:20px;font-weight:bold;color:#0f766e;margin:0 0 12px;"),
            Map.entry("h3", "font-size:17px;font-weight:bold;color:#0f766e;margin:0 0 10px;"),
            Map.entry("h4", "font-size:15px;font-weight:bold;color:#0f766e;margin:0 0 10px;"),
            Map.entry("p", "margin:0 0 12px;"),
            Map.entry("ul", "margin:0 0 12px;padding-left:20px;"),
            Map.entry("ol", "margin:0 0 12px;padding-left:20px;"),
            Map.entry("li", "margin:0 0 6px;"),
            Map.entry("a", "color:#0d9488;text-decoration:underline;"),
            Map.entry("blockquote",
                    "margin:0 0 12px;padding:8px 16px;border-left:4px solid #0d9488;background:#f9fafb;color:#374151;"),
            Map.entry("pre",
                    "margin:0 0 12px;padding:12px;background:#f3f4f6;border-radius:6px;font-family:Consolas,monospace;font-size:13px;white-space:pre-wrap;"),
            Map.entry("img", "max-width:100%;height:auto;"),
            Map.entry("hr", "border:0;border-top:1px solid #e5e7eb;margin:16px 0;")
    );

    private static final Map<String, String> ALIGN_CLASSES = Map.of(
            "ql-align-center", "text-align:center;",
            "ql-align-right", "text-align:right;",
            "ql-align-justify", "text-align:justify;"
    );

    /** Cỡ chữ của trình soạn thảo cũng là class, phải quy ra px cụ thể cho hộp thư. */
    private static final Map<String, String> SIZE_CLASSES = Map.of(
            "ql-size-small", "font-size:13px;",
            "ql-size-large", "font-size:20px;",
            "ql-size-huge", "font-size:28px;"
    );

    private static final String INDENT_CLASS_PREFIX = "ql-indent-";
    private static final int INDENT_STEP_PX = 24;

    public String toEmailHtml(String html) {
        if (html == null || html.isBlank()) {
            return "";
        }
        Document document = Jsoup.parseBodyFragment(html);
        document.outputSettings().prettyPrint(false);

        // Email client không chạy script và bỏ qua <style>; giữ lại chỉ tổ khiến thư bị
        // đánh dấu spam.
        document.select("script, style").remove();

        for (Element element : document.body().select("*")) {
            removeUnsafeAttributes(element);
            inlineStyles(element);
        }
        return document.body().html();
    }

    private void removeUnsafeAttributes(Element element) {
        List<String> eventAttributes = element.attributes().asList().stream()
                .map(Attribute::getKey)
                .filter(key -> key.toLowerCase().startsWith("on"))
                .toList();
        eventAttributes.forEach(element::removeAttr);

        if (element.hasAttr("href")
                && element.attr("href").trim().toLowerCase().startsWith("javascript:")) {
            element.removeAttr("href");
        }
    }

    private void inlineStyles(Element element) {
        String ownStyle = element.attr("style").trim();
        StringBuilder style = new StringBuilder();

        if (ownStyle.isEmpty()) {
            String defaultStyle = DEFAULT_STYLES.get(element.tagName());
            if (defaultStyle != null) {
                style.append(defaultStyle);
            }
        } else {
            style.append(ownStyle);
            if (!ownStyle.endsWith(";")) {
                style.append(';');
            }
        }

        style.append(classStyles(element));

        if (style.length() > 0) {
            element.attr("style", style.toString());
        }
        // Class của editor vô nghĩa trong email vì không có bảng style đi kèm.
        element.removeAttr("class");
    }

    private String classStyles(Element element) {
        StringBuilder styles = new StringBuilder();
        for (String className : element.classNames()) {
            String alignStyle = ALIGN_CLASSES.get(className);
            if (alignStyle != null) {
                styles.append(alignStyle);
                continue;
            }
            String sizeStyle = SIZE_CLASSES.get(className);
            if (sizeStyle != null) {
                styles.append(sizeStyle);
                continue;
            }
            if (className.startsWith(INDENT_CLASS_PREFIX)) {
                styles.append("padding-left:")
                        .append(indentLevel(className) * INDENT_STEP_PX)
                        .append("px;");
            }
        }
        return styles.toString();
    }

    private int indentLevel(String className) {
        try {
            return Integer.parseInt(className.substring(INDENT_CLASS_PREFIX.length()));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
