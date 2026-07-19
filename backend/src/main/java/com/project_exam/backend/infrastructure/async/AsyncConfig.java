package com.project_exam.backend.infrastructure.async;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * Bật xử lý bất đồng bộ và cấu hình executor riêng cho việc ghi lượt truy cập.
 *
 * <p>Ghi page-visit có thể phải tra geo-IP qua mạng (tới ~2s) nên tách khỏi thread request:
 * pool nhỏ, có hàng đợi giới hạn, đầy thì bỏ lượt mới nhất (analytics chấp nhận mất vài lượt
 * còn hơn phình thread hoặc chặn request).
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "visitExecutor")
    public Executor visitExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("visit-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardPolicy());
        executor.initialize();
        return executor;
    }
}
