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

        // 3. Debug để kiểm tra (Bạn nhớ check xem có đủ số "2005" chưa nhé)
        System.out.println("--- DEBUG DB PASSWORD: [" + System.getProperty("SPRING_DATASOURCE_PASSWORD") + "] ---");

        // 4. Khởi chạy Spring Boot
        SpringApplication.run(TestApplication.class, args);
    }
}