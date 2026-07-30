package com.project_exam.backend.modules.assessment.exam.util;

import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.domain.Question;

import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public final class AnswerGradingUtil {

    private AnswerGradingUtil() {}

    public static Set<String> parseIds(String csv) {
        if (csv == null || csv.isBlank()) return Set.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    public static String toCsv(Collection<String> ids) {
        if (ids == null || ids.isEmpty()) return null;
        return ids.stream().filter(s -> s != null && !s.isBlank()).distinct().collect(Collectors.joining(","));
    }

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
                return false;
        }
    }
}
