# Project Exam

- `backend/`: Spring Boot 3 (Java 17), PostgreSQL, Redis
- `frontend/`: Next.js 16 (pnpm)

## Môi trường dev bằng Docker

Docker ở đây **chỉ cung cấp môi trường** (JDK 17, Maven, Node 22, pnpm, PostgreSQL, Redis), không đóng gói dự án.
Code vẫn nằm trên máy, container chạy thẳng trên thư mục code nên sửa code là tự reload.

Máy chỉ cần cài [Docker Desktop](https://www.docker.com/products/docker-desktop/) và IDE.

### Lần đầu

```powershell
git clone <repo-url>
cd Project-exam

copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Mở 2 file `.env` vừa tạo, điền các key còn trống (Gemini, Cloudinary, Google OAuth, mail...), xin trưởng nhóm qua kênh riêng. **Không commit file `.env`.**

```powershell
docker compose up -d
docker compose logs -f
```

Lần đầu mất vài phút để tải thư viện. Chạy xong khi log có `Started TestApplication` (backend) và `Ready` (frontend). Bấm `Ctrl+C` để thoát xem log (app vẫn chạy).

| Dịch vụ  | Địa chỉ                                                       |
| -------- | ------------------------------------------------------------- |
| Web      | http://localhost:3000                                         |
| API      | http://localhost:8081                                         |
| Postgres | `localhost:15432`, db `project_exam`, `postgres` / `postgres` |
| Redis    | `localhost:16379`                                             |

Lần đầu chạy, DB tự được nạp dữ liệu từ `database/project_exam.sql`. Các lần sau dữ liệu được giữ nguyên, không nạp lại.
Muốn nạp lại từ đầu (vd khi có file SQL mới): `docker compose down -v` rồi `docker compose up -d`.

### Khi code

Container tự chạy `mvn spring-boot:run` và `pnpm dev`, không cần gõ lệnh:

- Sửa frontend: lưu file là trình duyệt tự cập nhật.
- Sửa backend: lưu file `.java` là container tự compile và restart app (vài giây).

Lệnh hay dùng:

```powershell
docker compose logs -f backend               # xem log backend
docker compose restart backend               # sau khi đổi pom.xml hoặc backend/.env
docker compose restart frontend              # sau khi đổi package.json hoặc frontend/.env
docker compose exec frontend pnpm add <gói>  # thêm thư viện frontend
docker compose down                          # tắt (giữ dữ liệu DB)
docker compose down -v                       # tắt, xoá DB (lần up sau nạp lại từ database/) + thư viện đã tải
```

Nếu port 3000/8081 đang bị chiếm (PowerShell):

```powershell
$env:BACKEND_PORT=18081; $env:FRONTEND_PORT=13000; docker compose up -d
```

Lúc này đăng nhập Google sẽ không redirect đúng vì OAuth đang khai báo `http://localhost:3000`.

## Chạy app trực tiếp trên máy (không qua Docker)

Chỉ lấy PostgreSQL và Redis từ Docker, còn app chạy trên máy. Cần tự cài JDK 17, Maven, Node 22, pnpm.

```powershell
docker compose up -d postgres redis
```

Mở 2 terminal:

```powershell
# Terminal 1
cd backend
mvn spring-boot:run
```

```powershell
# Terminal 2
cd frontend
pnpm install
pnpm dev
```

`backend/.env.example` đã trỏ sẵn DB về `127.0.0.1:15432` và Redis về `127.0.0.1:16379`.
Không chạy cách này cùng lúc với `docker compose up -d` (đầy đủ) vì trùng port 3000/8081.
