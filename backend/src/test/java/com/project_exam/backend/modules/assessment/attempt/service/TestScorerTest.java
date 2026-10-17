package com.project_exam.backend.modules.assessment.attempt.service;

import com.project_exam.backend.modules.assessment.attempt.domain.UserAnswer;
import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.repository.AnswerRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ScoringConversionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TestScorerTest {

    private static final int TOTAL = 10;

    private TestScorer scorer;

    @BeforeEach
    void setUp() {
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        AnswerRepository answerRepository = mock(AnswerRepository.class);

        // q1..q10 đều là MCQ, đáp án đúng của qN là "qN-ok".
        List<Question> questions = IntStream.rangeClosed(1, TOTAL).mapToObj(i -> {
            Question q = new Question();
            q.setQuestionId("q" + i);
            q.setQuestionType(Question.QuestionType.MCQ);
            return q;
        }).toList();
        List<Answer> correctAnswers = IntStream.rangeClosed(1, TOTAL).mapToObj(i -> {
            Answer a = new Answer();
            a.setAnswerId("q" + i + "-ok");
            a.setQuestionId("q" + i);
            a.setIsCorrect(true);
            return a;
        }).toList();
        when(questionRepository.findAllById(anyCollection())).thenReturn(questions);
        when(answerRepository.findByQuestionIdInAndIsCorrectTrue(anyList())).thenReturn(correctAnswers);

        scorer = new TestScorer(questionRepository, answerRepository,
                mock(ExamPartRepository.class), mock(ScoringConversionRepository.class));
    }

    /** {@code correct} câu đúng (q1..), {@code wrong} câu sai (tiếp theo). */
    private static List<UserAnswer> answers(int correct, int wrong) {
        List<UserAnswer> list = new ArrayList<>();
        for (int i = 1; i <= correct + wrong; i++) {
            UserAnswer ua = new UserAnswer();
            ua.setQuestionId("q" + i);
            ua.setSelectedAnswerId(i <= correct ? "q" + i + "-ok" : "q" + i + "-bad");
            list.add(ua);
        }
        return list;
    }

    private static ExamType defaultType() {
        ExamType t = new ExamType();
        t.setScoringMethod("DEFAULT");
        return t;
    }

    private static ExamType awsType() {
        ExamType t = new ExamType();
        t.setScoringMethod("AWS_SCALE");
        t.setScoreMin(100);
        t.setScoreMax(1000);
        return t;
    }

    private int score(List<UserAnswer> answers, ExamType type) {
        return scorer.scoreFullTest(answers, null, type, TOTAL);
    }

    @Test
    @DisplayName("DEFAULT: thang 0–100 theo tỉ lệ câu đúng")
    void defaultScale() {
        assertEquals(80, score(answers(8, 2), defaultType()));
        assertEquals(100, score(answers(10, 0), defaultType()));
        assertEquals(0, score(answers(0, 10), defaultType()));
        assertEquals(0, score(List.of(), defaultType()));
    }

    @Test
    @DisplayName("AWS: thang 100–1000 theo tỉ lệ câu đúng")
    void awsScale() {
        assertEquals(820, score(answers(8, 2), awsType()));
        assertEquals(1000, score(answers(10, 0), awsType()));
        assertEquals(100, score(answers(0, 10), awsType()));
        assertEquals(100, score(List.of(), awsType()));
    }

    @Test
    @DisplayName("Câu bỏ trống tính là sai: mẫu số là tổng số câu của đề")
    void unansweredCountAsWrong() {
        assertEquals(30, score(answers(3, 0), defaultType()));
        assertEquals(370, score(answers(3, 0), awsType()));
    }

    @Test
    @DisplayName("Trả lời trùng một câu chỉ tính một lần")
    void duplicateAnswersCountOnce() {
        List<UserAnswer> list = new ArrayList<>(answers(5, 0));
        list.addAll(answers(5, 0));
        assertEquals(50, score(list, defaultType()));
        assertEquals(550, score(list, awsType()));
    }

    @Test
    @DisplayName("Làm tròn tỉ lệ lẻ")
    void roundsFractions() {
        // 1/7 × 900 = 128.57 → 129; 1/7 × 100 = 14.29 → 14
        assertEquals(229, scorer.scoreFullTest(answers(1, 0), null, awsType(), 7));
        assertEquals(14, scorer.scoreFullTest(answers(1, 0), null, defaultType(), 7));
    }

    @Test
    @DisplayName("Thang tuỳ chỉnh lấy từ score_min/score_max, không cần sửa code")
    void customScale() {
        ExamType t = defaultType();
        t.setScoreMin(1);
        t.setScoreMax(1000);
        assertEquals(800, score(answers(8, 2), t));
        assertEquals(1, score(List.of(), t));
    }

    @Test
    @DisplayName("Phần trăm 0–100 cho luyện tập TOEIC chưa đủ kỹ năng")
    void percent() {
        assertEquals(80, scorer.scorePercent(answers(8, 2), TOTAL));
        assertEquals(0, scorer.scorePercent(List.of(), TOTAL));
    }
}
