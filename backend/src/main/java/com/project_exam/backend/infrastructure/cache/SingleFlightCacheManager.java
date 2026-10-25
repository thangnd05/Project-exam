package com.project_exam.backend.infrastructure.cache;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.jspecify.annotations.Nullable;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Bọc mọi cache của manager gốc bằng SingleFlightCache; mỗi tên cache giữ đúng một bộ khoá.
final class SingleFlightCacheManager implements CacheManager {

    private final CacheManager delegate;
    private final Map<String, Cache> caches = new ConcurrentHashMap<>();

    SingleFlightCacheManager(CacheManager delegate) {
        this.delegate = delegate;
    }

    @Override
    @Nullable
    public Cache getCache(String name) {
        Cache cached = caches.get(name);
        if (cached != null) {
            return cached;
        }
        Cache target = delegate.getCache(name);
        return target == null ? null : caches.computeIfAbsent(name, n -> new SingleFlightCache(target));
    }

    @Override
    public Collection<String> getCacheNames() {
        return delegate.getCacheNames();
    }
}
