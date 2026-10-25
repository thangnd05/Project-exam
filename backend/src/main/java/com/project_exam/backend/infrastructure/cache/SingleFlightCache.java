package com.project_exam.backend.infrastructure.cache;

import org.springframework.cache.Cache;
import org.jspecify.annotations.Nullable;

import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;

// RedisCache với nonLockingRedisCacheWriter không khoá gì khi @Cacheable(sync = true): cache vừa hết hạn mà
// nhiều request cùng tới thì tất cả cùng xuống DB. Lớp này cho mỗi key chỉ một request nạp, các request
// khác chờ rồi đọc lại từ Redis. Khoá theo từng JVM nên chạy N instance thì tối đa N lần nạp.
final class SingleFlightCache implements Cache {

    // Khoá theo dải băm của key thay vì mỗi key một khoá để không phải dọn map khoá.
    private static final int STRIPES = 64;

    private final Cache delegate;
    private final ReentrantLock[] locks = new ReentrantLock[STRIPES];

    SingleFlightCache(Cache delegate) {
        this.delegate = delegate;
        for (int i = 0; i < STRIPES; i++) {
            locks[i] = new ReentrantLock();
        }
    }

    @Override
    @Nullable
    @SuppressWarnings("unchecked")
    public <T> T get(Object key, Callable<T> valueLoader) {
        ValueWrapper hit = delegate.get(key);
        if (hit != null) {
            return (T) hit.get();
        }
        ReentrantLock lock = locks[Math.floorMod(key.hashCode(), STRIPES)];
        lock.lock();
        try {
            // delegate tự đọc lại trước khi gọi valueLoader: request trước đã nạp xong thì lấy luôn.
            return delegate.get(key, valueLoader);
        } finally {
            lock.unlock();
        }
    }

    @Override
    public String getName() {
        return delegate.getName();
    }

    @Override
    public Object getNativeCache() {
        return delegate.getNativeCache();
    }

    @Override
    @Nullable
    public ValueWrapper get(Object key) {
        return delegate.get(key);
    }

    @Override
    @Nullable
    public <T> T get(Object key, @Nullable Class<T> type) {
        return delegate.get(key, type);
    }

    @Override
    @Nullable
    public CompletableFuture<?> retrieve(Object key) {
        return delegate.retrieve(key);
    }

    @Override
    public <T> CompletableFuture<T> retrieve(Object key, Supplier<CompletableFuture<T>> valueLoader) {
        return delegate.retrieve(key, valueLoader);
    }

    @Override
    public void put(Object key, @Nullable Object value) {
        delegate.put(key, value);
    }

    @Override
    @Nullable
    public ValueWrapper putIfAbsent(Object key, @Nullable Object value) {
        return delegate.putIfAbsent(key, value);
    }

    @Override
    public void evict(Object key) {
        delegate.evict(key);
    }

    @Override
    public boolean evictIfPresent(Object key) {
        return delegate.evictIfPresent(key);
    }

    @Override
    public void clear() {
        delegate.clear();
    }

    @Override
    public boolean invalidate() {
        return delegate.invalidate();
    }
}
