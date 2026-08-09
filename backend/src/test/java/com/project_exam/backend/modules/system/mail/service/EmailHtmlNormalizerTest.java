package com.project_exam.backend.modules.system.mail.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EmailHtmlNormalizerTest {

    private final EmailHtmlNormalizer normalizer = new EmailHtmlNormalizer();

    @Test
    void themStyleInlineChoTheDoTrinhSoanThaoXuatRa() {
        String result = normalizer.toEmailHtml("<h2>Xin chào</h2><p>Nội dung</p>");

        assertTrue(result.contains("<h2 style=\"font-size:20px"));
        assertTrue(result.contains("<p style=\"margin:0 0 12px;\""));
    }

    @Test
    void doiClassCanLeCuaEditorThanhStyleInline() {
        String result = normalizer.toEmailHtml("<p class=\"ql-align-center\">Giữa</p>");

        assertTrue(result.contains("text-align:center;"));
        assertFalse(result.contains("ql-align-center"));
    }

    @Test
    void doiClassThutDauDongThanhPaddingTheoCap() {
        String result = normalizer.toEmailHtml("<p class=\"ql-indent-2\">Thụt</p>");

        assertTrue(result.contains("padding-left:48px;"));
    }

    @Test
    void giuNguyenStyleTacGiaTuViet() {
        String button = "<a href=\"https://x.dev\" style=\"background:#0d9488;padding:12px 22px;\">Bấm</a>";

        String result = normalizer.toEmailHtml(button);

        assertTrue(result.contains("background:#0d9488;padding:12px 22px;"));
        assertFalse(result.contains("text-decoration:underline"));
    }

    @Test
    void boScriptVaThuocTinhSuKien() {
        String result = normalizer.toEmailHtml(
                "<p onclick=\"steal()\">Hi</p><script>alert(1)</script>");

        assertFalse(result.contains("script"));
        assertFalse(result.contains("onclick"));
    }

    @Test
    void boHrefJavascript() {
        String result = normalizer.toEmailHtml("<a href=\"javascript:alert(1)\">Bẫy</a>");

        assertFalse(result.contains("javascript:"));
    }

    @Test
    void noiDungRongTraVeChuoiRong() {
        assertEquals("", normalizer.toEmailHtml(null));
        assertEquals("", normalizer.toEmailHtml("   "));
    }
}
