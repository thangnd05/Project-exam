package com.project_exam.backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TestApplication {

    public static void main(String[] args) {

        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();

        // Biến môi trường thật (vd do docker compose truyền vào) được ưu tiên hơn file .env
        dotenv.entries(Dotenv.Filter.DECLARED_IN_ENV_FILE).forEach(entry -> {
            String envName = entry.getKey().toUpperCase().replace('.', '_').replace('-', '_');
            if (System.getenv(entry.getKey()) == null && System.getenv(envName) == null) {
                System.setProperty(entry.getKey(), entry.getValue().trim());
            }
        });

        SpringApplication.run(TestApplication.class, args);
    }
}
