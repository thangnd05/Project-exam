package com.project_exam.backend.modules.posts.react.mapper;

import com.project_exam.backend.modules.posts.react.dto.ReactSummaryResponse;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ReactMapper {

    /**
     * Map sang ReactSummaryResponse. counts/total/currentUserReactType do service
     * tính sẵn rồi truyền vào.
     */
    public ReactSummaryResponse toSummary(Map<String, Long> counts,
                                          String currentUserReactType,
                                          long total) {
        return ReactSummaryResponse.builder()
                .counts(counts)
                .currentUserReactType(currentUserReactType)
                .total(total)
                .build();
    }
}
