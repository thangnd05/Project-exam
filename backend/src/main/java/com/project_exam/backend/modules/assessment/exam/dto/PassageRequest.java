package com.project_exam.backend.modules.assessment.exam.dto;

import com.project_exam.backend.modules.assessment.exam.domain.Passage;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PassageRequest {
    private String content;
    private String contentTranslation;
    private String mediaUrl;
    private Passage.PassageType passageType;

    private List<String> extraContents;
}
