package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.Passage; // Giả sử bạn có enum PassageType
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PassageRequest {
    private String content;
    private String contentTranslation; // Optional - bản dịch của content
    private String mediaUrl; // Optional
    private Passage.PassageType passageType;
    // Các đoạn text bổ sung (passage nhiều đoạn). Lưu thành passage_media type=TEXT. Optional.
    private List<String> extraContents;
}