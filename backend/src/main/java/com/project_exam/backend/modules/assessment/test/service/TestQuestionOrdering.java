package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.modules.assessment.test.domain.TestQuestion;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.function.Function;

/**
 * Thứ tự câu trong một part. Câu cùng đoạn văn luôn đi liền nhau (khối đặt ở vị trí câu đầu tiên của đoạn),
 * khi xáo thì xáo theo khối nên nhóm đoạn văn không bị tách.
 */
public final class TestQuestionOrdering {

    private TestQuestionOrdering() {
    }

    /**
     * @param ordered   câu của part theo display_order
     * @param passageOf questionId -> passageId (null nếu câu đơn)
     * @param random    null thì giữ thứ tự gốc
     */
    public static List<TestQuestion> order(
            List<TestQuestion> ordered, Function<String, String> passageOf, Random random) {
        Map<String, List<TestQuestion>> units = new LinkedHashMap<>();
        for (TestQuestion tq : ordered) {
            String passageId = passageOf.apply(tq.getQuestionId());
            String key = passageId != null ? "P_" + passageId : "Q_" + tq.getTestQuestionId();
            units.computeIfAbsent(key, k -> new ArrayList<>()).add(tq);
        }
        List<List<TestQuestion>> blocks = new ArrayList<>(units.values());
        if (random != null) {
            Collections.shuffle(blocks, random);
        }
        List<TestQuestion> result = new ArrayList<>(ordered.size());
        blocks.forEach(result::addAll);
        return result;
    }

    /** Bộ sinh ngẫu nhiên cố định cho một lượt làm + part: cùng lượt làm luôn ra cùng thứ tự. */
    public static Random attemptRandom(String userTestId, String testPartId) {
        return new Random(Objects.hash(userTestId, testPartId));
    }
}
