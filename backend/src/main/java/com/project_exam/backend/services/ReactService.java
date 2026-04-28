package com.project_exam.backend.services;

import com.project_exam.backend.dto.request.ReactRequest;
import com.project_exam.backend.dto.response.ReactSummaryResponse;
import com.project_exam.backend.exception.NotFoundException;
import com.project_exam.backend.models.React;
import com.project_exam.backend.repositories.PostRepository;
import com.project_exam.backend.repositories.ReactRepository;
import com.project_exam.backend.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReactService {

    private final ReactRepository reactRepository;
    private final PostRepository postRepository;
    private final AuthUtils authUtils;

    /**
     * Toggle react:
     * - Chưa react → tạo mới
     * - Đã react cùng type → xóa (unlike)
     * - Đã react khác type → cập nhật type
     */
    @Transactional
    public ReactSummaryResponse toggleReact(String postId, ReactRequest request,
                                            HttpServletRequest httpRequest) {
        if (!postRepository.existsById(postId)) {
            throw new NotFoundException("Post không tồn tại");
        }
        String userId = authUtils.getUserId(httpRequest);
        Optional<React> existing = reactRepository.findByPostIdAndUserId(postId, userId);

        if (existing.isPresent()) {
            React react = existing.get();
            if (react.getType() == request.getType()) {
                // Cùng type → xóa (unlike)
                reactRepository.delete(react);
            } else {
                // Khác type → cập nhật
                react.setType(request.getType());
                reactRepository.save(react);
            }
        } else {
            // Chưa react → tạo mới
            React react = React.builder()
                    .postId(postId)
                    .userId(userId)
                    .type(request.getType())
                    .build();
            reactRepository.save(react);
        }

        return buildSummary(postId, userId);
    }

    public ReactSummaryResponse getReactSummary(String postId, HttpServletRequest httpRequest) {
        if (!postRepository.existsById(postId)) {
            throw new NotFoundException("Post không tồn tại");
        }
        String currentUserId = tryGetUserId(httpRequest);
        return buildSummary(postId, currentUserId);
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────

    private ReactSummaryResponse buildSummary(String postId, String currentUserId) {
        Map<String, Long> counts = new LinkedHashMap<>();
        long total = 0;

        for (React.ReactType type : React.ReactType.values()) {
            long count = reactRepository.countByPostIdAndType(postId, type);
            if (count > 0) counts.put(type.name(), count);
            total += count;
        }

        String currentUserReactType = null;
        if (currentUserId != null) {
            currentUserReactType = reactRepository.findByPostIdAndUserId(postId, currentUserId)
                    .map(r -> r.getType().name())
                    .orElse(null);
        }

        return ReactSummaryResponse.builder()
                .counts(counts)
                .currentUserReactType(currentUserReactType)
                .total(total)
                .build();
    }

    private String tryGetUserId(HttpServletRequest httpRequest) {
        try {
            return authUtils.getUserId(httpRequest);
        } catch (Exception e) {
            return null;
        }
    }
}
