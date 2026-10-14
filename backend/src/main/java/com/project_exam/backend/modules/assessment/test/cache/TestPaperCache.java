package com.project_exam.backend.modules.assessment.test.cache;

import com.project_exam.backend.infrastructure.cache.CacheNames;
import com.project_exam.backend.modules.assessment.test.dto.TestPartResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.function.Supplier;

@Slf4j
@Component
@RequiredArgsConstructor
public class TestPaperCache {

    private final CacheManager cacheManager;

    // Nội dung đề (phần thi, câu hỏi, đáp án, passage) theo thứ tự gốc: giống nhau với mọi người làm bài.
    // Thứ tự đã xáo theo từng lượt làm thì không đi qua đây.
    @Cacheable(cacheNames = CacheNames.TEST_PAPER, key = "#testId")
    public List<TestPartResponse> getParts(String testId, Supplier<List<TestPartResponse>> loader) {
        return loader.get();
    }

    // Một câu hỏi có thể nằm trong nhiều đề nên xoá cả cache; admin sửa đề ít nên nạp lại không tốn.
    // Xoá sau commit: xoá sớm thì request khác có thể nạp lại bản cũ trước khi transaction ghi xong.
    public void evictAllAfterCommit() {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            evictAll();
            return;
        }
        boolean scheduled = TransactionSynchronizationManager.getSynchronizations().stream()
                .anyMatch(EvictAfterCommit.class::isInstance);
        if (!scheduled) {
            TransactionSynchronizationManager.registerSynchronization(new EvictAfterCommit());
        }
    }

    private void evictAll() {
        Cache cache = cacheManager.getCache(CacheNames.TEST_PAPER);
        if (cache == null) return;
        try {
            cache.clear();
        } catch (RuntimeException e) {
            log.warn("Không xoá được cache đề thi, dữ liệu cũ sẽ tự hết hạn: {}", e.getMessage());
        }
    }

    private class EvictAfterCommit implements TransactionSynchronization {
        @Override
        public void afterCommit() {
            evictAll();
        }
    }
}
