package com.project_exam.backend.modules.assessment.exam.service;

import com.project_exam.backend.modules.assessment.exam.dto.AnswerRequest;
import com.project_exam.backend.modules.assessment.exam.dto.NormalQuestionRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Harness debug: chạy parser thật trên 1 file Word để xem nó ra bao nhiêu câu,
 * câu nào mất explanation. Bật bằng: mvn -Ddoc=/path/to/file.docx test -Dtest=QuestionImportDebugTest
 */
class QuestionImportDebugTest {

    @Test
    @EnabledIfSystemProperty(named = "doc", matches = ".+")
    void dumpParseResult() throws Exception {
        String docPath = System.getProperty("doc");
        Path path = Path.of(docPath);
        byte[] bytes = Files.readAllBytes(path);
        String name = path.getFileName().toString();
        MockMultipartFile file = new MockMultipartFile("file", name, null, bytes);

        QuestionDocumentImportService service = new QuestionDocumentImportService();
        List<NormalQuestionRequest> questions = service.parseQuestionsFromDocument(file);

        System.out.println("\n================ PARSE RESULT ================");
        System.out.println("File: " + name);
        System.out.println("Total questions parsed: " + questions.size());
        int noExpl = 0;
        int emptyStem = 0;
        for (int i = 0; i < questions.size(); i++) {
            NormalQuestionRequest q = questions.get(i);
            boolean hasExpl = q.getExplanation() != null && !q.getExplanation().trim().isEmpty();
            if (!hasExpl) noExpl++;
            String stem = q.getQuestionText() == null ? "" : q.getQuestionText().trim();
            if (stem.isEmpty()) emptyStem++;
            String stemShort = stem.length() > 60 ? stem.substring(0, 60) + "…" : stem;
            String correct = "";
            if (q.getAnswers() != null) {
                for (AnswerRequest a : q.getAnswers()) {
                    if (Boolean.TRUE.equals(a.getIsCorrect())) correct += a.getAnswerLabel();
                }
            }
            System.out.printf(
                    "[%3d] opts=%d correct=%-3s expl=%s stem=\"%s\"%n",
                    i + 1,
                    q.getAnswers() == null ? 0 : q.getAnswers().size(),
                    correct.isEmpty() ? "-" : correct,
                    hasExpl ? "YES" : "NO ",
                    stemShort
            );
        }
        System.out.println("---------------------------------------------");
        System.out.println("Questions WITHOUT explanation: " + noExpl);
        System.out.println("Questions WITH empty stem    : " + emptyStem);
        System.out.println("=============================================\n");
    }
}
