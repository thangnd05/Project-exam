package com.project_exam.backend.modules.assessment.test.cache;

import com.project_exam.backend.infrastructure.cache.CacheEvictor;
import com.project_exam.backend.infrastructure.cache.CacheNames;
import com.project_exam.backend.modules.assessment.test.dto.TestPartResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
public class TestPaperCache {

    private final CacheEvictor cacheEvictor;

    // Nội dung đề (phần thi, câu hỏi, đáp án, passage) theo thứ tự gốc: giống nhau với mọi người làm bài.
    // Thứ tự đã xáo theo từng lượt làm thì không đi qua đây.
    // sync: cả lớp cùng mở một đề lúc cache trống thì chỉ một request dựng đề từ DB.
    @Cacheable(cacheNames = CacheNames.TEST_PAPER, key = "#testId", sync = true)
    public List<TestPartResponse> getParts(String testId, Supplier<List<TestPartResponse>> loader) {
        return loader.get();
    }

    // Một câu hỏi có thể nằm trong nhiều đề nên xoá cả cache; admin sửa đề ít nên nạp lại không tốn.
    public void evictAllAfterCommit() {
        cacheEvictor.clearAfterCommit(CacheNames.TEST_PAPER);
    }
}
