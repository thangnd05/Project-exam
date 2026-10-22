package com.project_exam.backend.shared.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/** Chuyển chuỗi (tiếng Việt có dấu) thành slug URL: chữ thường không dấu, số, nối bằng gạch ngang. */
public final class SlugUtils {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9]+");
    private static final Pattern EDGE_DASHES = Pattern.compile("(^-+)|(-+$)");

    private SlugUtils() {
    }

    /** "AWS DOP-C02 Đề số 1" -> "aws-dop-c02-de-so-1"; trả chuỗi rỗng nếu không còn ký tự hợp lệ. */
    public static String toSlug(String input, int maxLength) {
        if (input == null) return "";
        String text = input.replace('đ', 'd').replace('Đ', 'D');
        text = DIACRITICS.matcher(Normalizer.normalize(text, Normalizer.Form.NFD)).replaceAll("");
        text = NON_ALNUM.matcher(text.toLowerCase(Locale.ROOT)).replaceAll("-");
        text = EDGE_DASHES.matcher(text).replaceAll("");
        if (text.length() > maxLength) {
            text = EDGE_DASHES.matcher(text.substring(0, maxLength)).replaceAll("");
        }
        return text;
    }
}
