package com.project_exam.backend.modules.assessment.exam.util;

import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.domain.Question;

import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Logic chấm điểm dùng chung cho mọi nơi (đề thi, learning plan): MCQ 1 đáp án,
 * MSQ nhiều đáp án (all-or-nothing), FILL_BLANK so text. ESSAY chấm tay luôn false ở đây.
 */
public final class AnswerGradingUtil {

    private AnswerGradingUtil() {}

    /** Tách chuỗi id đáp án (lưu dạng CSV) thành set, bỏ phần tử rỗng. */
    public static Set<String> parseIds(String csv) {
        if (csv == null || csv.isBlank()) return Set.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    /** Gộp danh sách id thành CSV (để lưu lựa chọn MSQ của user). */
    public static String toCsv(Collection<String> ids) {
        if (ids == null || ids.isEmpty()) return null;
        return ids.stream().filter(s -> s != null && !s.isBlank()).distinct().collect(Collectors.joining(","));
    }

    /**
     * Chấm 1 câu.
     * @param type          loại câu hỏi
     * @param selectedAnswerId   lựa chọn đơn (MCQ)
     * @param selectedIdsCsv     lựa chọn nhiều (MSQ), CSV id
     * @param answerText         text tự điền (FILL_BLANK)
     * @param correctAnswers     danh sách đáp án đúng của câu (isCorrect=true)
     */
    public static boolean isCorrect(
            Question.QuestionType type,
            String selectedAnswerId,
            String selectedIdsCsv,
            String answerText,
            List<Answer> correctAnswers) {

        if (type == null || correctAnswers == null || correctAnswers.isEmpty()) return false;

        switch (type) {
            case MCQ:
                return selectedAnswerId != null
                        && correctAnswers.stream().anyMatch(a -> selectedAnswerId.equals(a.getAnswerId()));

            case MSQ: {
                // all-or-nothing: tập chọn == tập đáp án đúng, không thiếu không thừa.
                Set<String> correctIds = correctAnswers.stream()
                        .map(Answer::getAnswerId)
                        .collect(Collectors.toSet());
                Set<String> chosen = parseIds(selectedIdsCsv);
                return !chosen.isEmpty() && chosen.equals(correctIds);
            }

            case FILL_BLANK:
                return answerText != null
                        && correctAnswers.stream().anyMatch(a ->
                                a.getAnswerText() != null
                                        && a.getAnswerText().trim().equalsIgnoreCase(answerText.trim()));

            default:
                return false; // ESSAY: chấm tay
        }
    }
}
