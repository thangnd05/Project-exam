package com.project_exam.backend.modules.assessment.attempt.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class TagBreakdownDto {
    private String tagId;
    private String tagName;
    private int correct;
    private int wrong;
    private int skipped;
    private int total;
    private double percentage;
    /** Danh sách câu thuộc tag (số câu + trạng thái) để bấm nhảy tới giải thích. */
    private List<TagQuestionRefDto> questions;
}
