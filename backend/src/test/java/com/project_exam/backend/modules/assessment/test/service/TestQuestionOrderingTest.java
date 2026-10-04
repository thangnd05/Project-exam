package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.modules.assessment.test.domain.TestQuestion;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TestQuestionOrderingTest {

    private static final Map<String, String> PASSAGES = Map.of("q3", "P", "q4", "P", "q5", "P");

    private static List<TestQuestion> part(int n) {
        return IntStream.rangeClosed(1, n)
                .mapToObj(i -> new TestQuestion("tq" + i, "part", "q" + i, i))
                .toList();
    }

    private static List<String> ids(List<TestQuestion> list) {
        return list.stream().map(TestQuestion::getQuestionId).toList();
    }

    @Test
    @DisplayName("Không xáo: giữ thứ tự gốc")
    void keepsOrderWithoutRandom() {
        List<TestQuestion> ordered = part(10);
        assertEquals(ids(ordered), ids(TestQuestionOrdering.order(ordered, PASSAGES::get, null)));
    }

    @Test
    @DisplayName("Cùng lượt làm luôn ra cùng thứ tự, lượt khác ra thứ tự khác")
    void attemptOrderIsStablePerAttempt() {
        List<TestQuestion> ordered = part(20);
        List<String> a1 = ids(TestQuestionOrdering.order(ordered, PASSAGES::get,
                TestQuestionOrdering.attemptRandom("attempt-1", "part")));
        List<String> a1Again = ids(TestQuestionOrdering.order(ordered, PASSAGES::get,
                TestQuestionOrdering.attemptRandom("attempt-1", "part")));
        List<String> a2 = ids(TestQuestionOrdering.order(ordered, PASSAGES::get,
                TestQuestionOrdering.attemptRandom("attempt-2", "part")));

        assertEquals(a1, a1Again);
        assertNotEquals(a1, a2);
        assertEquals(new HashSet<>(ids(ordered)), new HashSet<>(a1));
    }

    @Test
    @DisplayName("Nhóm đoạn văn không bị tách và giữ thứ tự bên trong")
    void passageGroupStaysTogether() {
        List<TestQuestion> ordered = part(12);
        Set<List<String>> seen = new HashSet<>();
        for (int i = 0; i < 50; i++) {
            List<String> result = ids(TestQuestionOrdering.order(ordered, PASSAGES::get,
                    TestQuestionOrdering.attemptRandom("attempt-" + i, "part")));
            int start = result.indexOf("q3");
            assertEquals(List.of("q3", "q4", "q5"), result.subList(start, start + 3));
            seen.add(result);
        }
        assertTrue(seen.size() > 1);
    }
}
