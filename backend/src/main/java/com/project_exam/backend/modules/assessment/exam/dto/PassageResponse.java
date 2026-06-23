package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.Passage;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassageResponse {
    private String passageId;
    private String content;
    private String contentTranslation;
    private String mediaUrl;
    private Passage.PassageType passageType;
    /** Danh sách audio/ảnh của passage (bảng passage_media). Rỗng nếu không có. */
    private List<PassageMediaResponse> passageMedias;
}
