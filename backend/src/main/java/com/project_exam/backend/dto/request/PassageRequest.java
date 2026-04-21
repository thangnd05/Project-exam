package com.project_exam.backend.dto.request;

import com.project_exam.backend.models.Passage; // Giả sử bạn có enum PassageType
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PassageRequest {
    private String content;
    private String mediaUrl; // Optional
    private Passage.PassageType passageType;
}