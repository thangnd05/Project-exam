package com.project_exam.backend.modules.assessment.exam.dto;

import lombok.Data;

import java.util.List;
@Data
public class PassageQuestionGroup {

    private PassageRequest passage;
    private List<NormalQuestionRequest> questions;
}

