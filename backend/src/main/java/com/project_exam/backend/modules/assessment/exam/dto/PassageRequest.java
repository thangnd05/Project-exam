package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.Passage; // Giả sử bạn có enum PassageType
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PassageRequest {
    private String content;
    private String contentTranslation; // Optional - bản dịch của content
    private String mediaUrl; // Optional
    private Passage.PassageType passageType;
}