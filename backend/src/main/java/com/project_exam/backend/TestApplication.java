package com.project_exam.backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TestApplication {

    public static void main(String[] args) {
        // 1. Cấu hình Dotenv để tìm file .env
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing() 
                .load();

        // 2. "Bơm" biến vào System và dùng .trim() để xóa ký tự thừa
        dotenv.entries().forEach(entry -> {
            System.setProperty(entry.getKey(), entry.getValue().trim());
        });

        // 4. Khởi chạy Spring Boot
        SpringApplication.run(TestApplication.class, args);
    }
}