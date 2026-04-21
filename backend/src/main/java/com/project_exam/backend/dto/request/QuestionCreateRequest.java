package com.project_exam.backend.dto.request;

import com.project_exam.backend.models.Question;
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
}

