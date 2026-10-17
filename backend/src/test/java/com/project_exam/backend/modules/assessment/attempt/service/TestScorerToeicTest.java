package com.project_exam.backend.modules.assessment.attempt.service;

import com.project_exam.backend.modules.assessment.attempt.domain.UserAnswer;
import com.project_exam.backend.modules.assessment.exam.domain.Answer;
import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.domain.ScoringConversion;
import com.project_exam.backend.modules.assessment.exam.repository.AnswerRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ExamPartRepository;
import com.project_exam.backend.modules.assessment.exam.repository.QuestionRepository;
import com.project_exam.backend.modules.assessment.exam.repository.ScoringConversionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TestScorerToeicTest {

    @Test
    @DisplayName("TOEIC: ExamPart chưa gán skill / câu không có part thì bỏ qua, không ném NPE")
    void partsWithoutSkillAreIgnored() {
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        AnswerRepository answerRepository = mock(AnswerRepository.class);
        ExamPartRepository examPartRepository = mock(ExamPartRepository.class);
        ScoringConversionRepository scoringConversionRepository = mock(ScoringConversionRepository.class);

        // q1 thuộc part có skill LISTENING, q2 thuộc part chưa gán skill, q3 không thuộc part nào.
        List<Question> questions = List.of(
                question("q1", "p-listening"),
                question("q2", "p-no-skill"),
                question("q3", null));
        when(questionRepository.findAllById(anyCollection())).thenReturn(questions);
        when(answerRepository.findByQuestionIdInAndIsCorrectTrue(anyList())).thenReturn(List.of(
                correct("q1"), correct("q2"), correct("q3")));
        when(examPartRepository.findAllById(anyCollection())).thenReturn(List.of(
                part("p-listening", "LISTENING"),
                part("p-no-skill", null)));
        when(scoringConversionRepository.findByExamTypeIdAndSkillIdAndNumCorrect(anyString(), anyString(), anyInt()))
                .thenReturn(Optional.empty());
        when(scoringConversionRepository.findByExamTypeIdAndSkillIdAndNumCorrect("toeic", "LISTENING", 1))
                .thenReturn(Optional.of(conversion(45)));

        TestScorer scorer = new TestScorer(questionRepository, answerRepository,
                examPartRepository, scoringConversionRepository);
        ExamType toeic = new ExamType();
        toeic.setExamTypeId("toeic");

        int score = scorer.scoreToeicOptimal(
                List.of(answer("q1"), answer("q2"), answer("q3")), null, toeic);

        // Chỉ q1 (LISTENING) được quy đổi; q2/q3 không có skill nên không cộng điểm.
        assertEquals(45, score);
    }

    private static Question question(String id, String examPartId) {
        Question q = new Question();
        q.setQuestionId(id);
        q.setQuestionType(Question.QuestionType.MCQ);
        q.setExamPartId(examPartId);
        return q;
    }

    private static Answer correct(String questionId) {
        Answer a = new Answer();
        a.setAnswerId(questionId + "-ok");
        a.setQuestionId(questionId);
        a.setIsCorrect(true);
        return a;
    }

    private static UserAnswer answer(String questionId) {
        UserAnswer ua = new UserAnswer();
        ua.setQuestionId(questionId);
        ua.setSelectedAnswerId(questionId + "-ok");
        return ua;
    }

    private static ExamPart part(String id, String skillId) {
        ExamPart p = new ExamPart();
        p.setExamPartId(id);
        p.setSkillId(skillId);
        return p;
    }

    private static ScoringConversion conversion(int score) {
        ScoringConversion c = new ScoringConversion();
        c.setConvertedScore(score);
        return c;
    }
}
