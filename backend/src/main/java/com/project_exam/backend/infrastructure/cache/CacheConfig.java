package com.project_exam.backend.infrastructure.cache;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project_exam.backend.modules.assessment.attempt.dto.QuickLeaderboardResponse;
import com.project_exam.backend.modules.assessment.exam.dto.ExamCategoryResponse;
import com.project_exam.backend.modules.assessment.exam.dto.ExamPartResponse;
import com.project_exam.backend.modules.assessment.exam.dto.ExamTypeResponse;
import com.project_exam.backend.modules.assessment.test.dto.TestPartResponse;
import com.project_exam.backend.modules.gamification.quest.domain.Quest;
import com.project_exam.backend.modules.gamification.streak.dto.StreakLeaderboardResponse;
import org.springframework.cache.CacheManager;
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
    private static final Duration CATALOG_TTL = Duration.ofMinutes(10);
    // Bảng xếp hạng không xoá theo lượt nộp bài, chỉ hết hạn: người dùng thấy thứ hạng mới sau tối đa chừng này.
    private static final Duration LEADERBOARD_TTL = Duration.ofSeconds(60);

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory, ObjectMapper objectMapper) {
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
                .prefixCacheNameWith("cache:")
                .disableCachingNullValues();

        // Xoá cả cache bằng SCAN thay vì KEYS để không chặn Redis khi nhiều key.
        RedisCacheWriter writer = RedisCacheWriter.nonLockingRedisCacheWriter(
                connectionFactory, BatchStrategies.scan(1000));

        CacheTypes types = new CacheTypes(defaults, objectMapper);
        RedisCacheManager redis = RedisCacheManager.builder(writer)
                .cacheDefaults(defaults)
                .withCacheConfiguration(CacheNames.TEST_PAPER,
                        types.listOf(TestPartResponse.class, TEST_PAPER_TTL))
                .withCacheConfiguration(CacheNames.EXAM_TYPES,
                        types.listOf(ExamTypeResponse.class, CATALOG_TTL))
                .withCacheConfiguration(CacheNames.EXAM_TYPE,
                        types.single(ExamTypeResponse.class, CATALOG_TTL))
                .withCacheConfiguration(CacheNames.EXAM_CATEGORIES,
                        types.listOf(ExamCategoryResponse.class, CATALOG_TTL))
                .withCacheConfiguration(CacheNames.EXAM_PARTS,
                        types.listOf(ExamPartResponse.class, CATALOG_TTL))
                .withCacheConfiguration(CacheNames.ACTIVE_QUESTS,
                        types.listOf(Quest.class, CATALOG_TTL))
                .withCacheConfiguration(CacheNames.HALL_OF_FAME,
                        types.single(QuickLeaderboardResponse.class, LEADERBOARD_TTL))
                .withCacheConfiguration(CacheNames.STREAK_LEADERBOARD,
                        types.single(StreakLeaderboardResponse.class, LEADERBOARD_TTL))
                .disableCreateOnMissingCache()
                .build();
        // Builder không qua vòng đời bean khi bị bọc nên phải tự khởi tạo danh sách cache.
        redis.initializeCaches();
        return new SingleFlightCacheManager(redis);
    }

    // Redis lỗi/chậm thì ghi log rồi đọc thẳng DB, không làm hỏng request.
    @Override
    public CacheErrorHandler errorHandler() {
        return new LoggingCacheErrorHandler();
    }

    // Serializer theo đúng kiểu từng cache, không bật default typing của Jackson.
    private record CacheTypes(RedisCacheConfiguration defaults, ObjectMapper objectMapper) {

        RedisCacheConfiguration single(Class<?> type, Duration ttl) {
            return withType(objectMapper.getTypeFactory().constructType(type), ttl);
        }

        RedisCacheConfiguration listOf(Class<?> elementType, Duration ttl) {
            return withType(objectMapper.getTypeFactory().constructCollectionType(List.class, elementType), ttl);
        }

        private RedisCacheConfiguration withType(JavaType type, Duration ttl) {
            return defaults
                    .entryTtl(ttl)
                    .serializeValuesWith(SerializationPair.fromSerializer(
                            new Jackson2JsonRedisSerializer<>(objectMapper, type)));
        }
    }
}
