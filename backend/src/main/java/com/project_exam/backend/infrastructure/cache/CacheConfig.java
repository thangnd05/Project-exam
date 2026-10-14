package com.project_exam.backend.infrastructure.cache;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project_exam.backend.modules.assessment.test.dto.TestPartResponse;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.interceptor.LoggingCacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.BatchStrategies;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.cache.RedisCacheWriter;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair;

import java.time.Duration;
import java.util.List;

@Configuration
@EnableCaching
public class CacheConfig implements CachingConfigurer {

    // Lưới an toàn nếu có đường ghi nào sót xoá cache: dữ liệu cũ tự hết hạn sau khoảng này.
    private static final Duration TEST_PAPER_TTL = Duration.ofMinutes(30);

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory, ObjectMapper objectMapper) {
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
                .prefixCacheNameWith("cache:")
                .disableCachingNullValues();

        // Serializer theo đúng kiểu từng cache, không bật default typing của Jackson.
        JavaType testPaperType = objectMapper.getTypeFactory()
                .constructCollectionType(List.class, TestPartResponse.class);
        RedisCacheConfiguration testPaper = defaults
                .entryTtl(TEST_PAPER_TTL)
                .serializeValuesWith(SerializationPair.fromSerializer(
                        new Jackson2JsonRedisSerializer<>(objectMapper, testPaperType)));

        // Xoá cả cache bằng SCAN thay vì KEYS để không chặn Redis khi nhiều key.
        RedisCacheWriter writer = RedisCacheWriter.nonLockingRedisCacheWriter(
                connectionFactory, BatchStrategies.scan(1000));

        return RedisCacheManager.builder(writer)
                .cacheDefaults(defaults)
                .withCacheConfiguration(CacheNames.TEST_PAPER, testPaper)
                .disableCreateOnMissingCache()
                .build();
    }

    // Redis lỗi/chậm thì ghi log rồi đọc thẳng DB, không làm hỏng request.
    @Override
    public CacheErrorHandler errorHandler() {
        return new LoggingCacheErrorHandler();
    }
}
