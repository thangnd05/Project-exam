# FrostScope - Backend

Spring Boot 3, Java 17, PostgreSQL (Flyway), Redis. Cách dựng môi trường bằng Docker: [README gốc](../README.md).

## Chạy

```bash
./mvnw spring-boot:run     # hoặc mvn spring-boot:run; API ở cổng server.port (Docker: 8081)
./mvnw test
```

Cấu hình đọc từ `.env` (mẫu ở `.env.example`, không commit `.env`). Schema do Flyway quản lý
(`src/main/resources/db/migration`), Hibernate chỉ `validate` - đổi bảng thì thêm migration mới
`V<yyyyMMdd><n>__mo_ta.sql`, không sửa migration cũ.

## Cấu trúc

```
com.project_exam.backend
  modules/            # nghiệp vụ, mỗi domain một package
    <domain>/<sub>/   #   controller, domain (entity), dto, mapper, repository, service
    admin/            #   controller + service riêng cho khu quản trị, dùng lại repository của domain
  infrastructure/     # hạ tầng: security (JWT, OAuth2), cache (Redis), cloudinary, scheduler, web
  shared/             # dto/exception/util dùng chung mọi module
```

Domain: `assessment` (đề, câu hỏi, lượt làm, chứng chỉ, lộ trình), `auth`, `users` (user, RBAC),
`classroom`, `posts`, `vocabulary`, `gamification`, `notes`, `system` (analytics, audit, mail).
