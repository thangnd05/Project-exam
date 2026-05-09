package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import lombok.*;

import java.util.List;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class QuestionCreateRequest {
    private String examPartId;
    private String classId;
    private String chapterId;
    private PassageRequest passage; // optional
    private String questionText;
    private Question.QuestionType questionType;
    private List<AnswerRequest> answers;
    /** true = lưu vào kho; false = chỉ gắn đề (tạo gắn thẳng). Mặc định service set theo API. */
    private Boolean isBank;
    private String collectionId;
    private String explanation;
}

