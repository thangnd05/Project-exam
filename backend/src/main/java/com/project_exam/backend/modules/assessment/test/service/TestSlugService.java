package com.project_exam.backend.modules.assessment.test.service;

import com.project_exam.backend.modules.assessment.test.domain.Test;
import com.project_exam.backend.modules.assessment.test.dto.TestRefResponse;
import com.project_exam.backend.modules.assessment.test.repository.TestRepository;
import com.project_exam.backend.shared.exception.NotFoundException;
import com.project_exam.backend.shared.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

/** Slug URL của đề: sinh từ tên khi tạo đề, và tra đề theo slug hoặc testId (link cũ dạng UUID). */
@Service
@RequiredArgsConstructor
public class TestSlugService {

    private static final int BASE_MAX_LENGTH = 100;
    private static final String FALLBACK = "de-thi";
    // Trùng đoạn tĩnh dưới /tests/ ở frontend (/tests/result/..., link cũ /tests/history/..., /tests/leaderboard/...).
    private static final Set<String> RESERVED = Set.of("result", "history", "leaderboard", "ref");
    private static final Pattern UUID_PATTERN =
            Pattern.compile("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

    private final TestRepository testRepository;

    /** Slug chưa đề nào (còn hoạt động) dùng: "aws-dop-c02-test-1", trùng thì "-2", "-3"... */
    public String generateUnique(String title) {
        String base = SlugUtils.toSlug(title, BASE_MAX_LENGTH);
        if (base.isEmpty()) base = FALLBACK;
        if (RESERVED.contains(base)) base = base + "-de";

        String candidate = base;
        for (int suffix = 2; testRepository.existsBySlug(candidate); suffix++) {
            candidate = base + "-" + suffix;
        }
        return candidate;
    }

    /** Nhận slug hoặc testId, trả cả hai để frontend gọi API bằng id và hiện URL bằng slug. */
    public TestRefResponse resolve(String key) {
        Optional<Test> test = UUID_PATTERN.matcher(key).matches()
                ? testRepository.findById(key)
                : testRepository.findBySlug(key.toLowerCase(Locale.ROOT));
        return test
                .map(t -> new TestRefResponse(t.getTestId(), t.getSlug()))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đề: " + key));
    }
}
