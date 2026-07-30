package com.project_exam.backend.modules.assessment.attempt.dto;

public record ResultSummaryDto(long correct, long wrong, long total,long totalScore) {
}
