package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import lombok.*;

import java.time.Instant;
import java.util.List;

/**
 * Một dòng trong bảng quản lý câu hỏi của admin.
 *
 * Cố tình KHÔNG mang theo đáp án, passage hay media: bảng chỉ cần đủ để nhận ra
 * câu và lọc, còn nội dung đầy đủ đã có ở modal sửa câu (getQuestionDetailAdmin).
 */
@Getter
@Builder
@AllArgsConstructor
public class AdminQuestionListItemResponse {

    private final String questionId;
    private final Integer questionNumber;
    private final String questionText;
    private final Question.QuestionType questionType;
    private final Question.UsageScope usageScope;
    private final Boolean isBank;
    private final Instant createdAt;

    private final String examPartId;
    private final String examPartName;
    private final String examTypeId;
    private final String examTypeName;

    private final String collectionId;
    private final String collectionName;

    private final List<String> tagNames;
}
