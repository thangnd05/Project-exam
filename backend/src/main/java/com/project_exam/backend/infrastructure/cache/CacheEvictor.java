package com.project_exam.backend.infrastructure.cache;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class CacheEvictor {

    private final CacheManager cacheManager;

    // Xoá sau commit: xoá sớm thì request khác có thể nạp lại bản cũ trước khi transaction ghi xong.
    // Một transaction ghi nhiều dòng chỉ xoá mỗi cache một lần.
    public void clearAfterCommit(String... cacheNames) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            Arrays.stream(cacheNames).forEach(this::clear);
            return;
        }
        ClearAfterCommit pending = TransactionSynchronizationManager.getSynchronizations().stream()
                .filter(ClearAfterCommit.class::isInstance)
                .map(ClearAfterCommit.class::cast)
                .findFirst()
                .orElseGet(() -> {
                    ClearAfterCommit created = new ClearAfterCommit();
                    TransactionSynchronizationManager.registerSynchronization(created);
                    return created;
                });
        pending.cacheNames.addAll(Arrays.asList(cacheNames));
    }

    private void clear(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache == null) return;
        try {
            cache.clear();
        } catch (RuntimeException e) {
            log.warn("Không xoá được cache {}, dữ liệu cũ sẽ tự hết hạn: {}", cacheName, e.getMessage());
        }
    }

    private class ClearAfterCommit implements TransactionSynchronization {

        private final Set<String> cacheNames = new LinkedHashSet<>();

        @Override
        public void afterCommit() {
            cacheNames.forEach(CacheEvictor.this::clear);
        }
    }
}
