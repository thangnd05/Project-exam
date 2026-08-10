package com.project_exam.backend.infrastructure.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.util.AntPathMatcher;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Chốt danh sách endpoint gọi được KHÔNG cần đăng nhập.
 *
 * Lý do tồn tại: GET /api/tests/admintest/{testId} từng nằm trong vùng permitAll của
 * SecurityConfig mà quên gọi requirePermission, thành ra ai cũng tải được đáp án của mọi đề.
 * Không có gì báo, vì "quên một dòng" thì compiler không thấy.
 *
 * Test này liệt kê mọi handler rơi vào vùng permitAll rồi so với danh sách đã duyệt bên dưới.
 * Thêm endpoint mới vào vùng public là test đỏ — buộc người thêm phải chọn: gắn kiểm tra quyền,
 * hay ghi tên nó vào đây một cách có ý thức.
 *
 * LƯU Ý: PERMIT_ALL phải soi gương với SecurityConfig.authorizeHttpRequests. Sửa một bên thì
 * sửa cả hai.
 */
class PublicEndpointApprovalTest {

    /** (method, ant-pattern) — "*" nghĩa là mọi HTTP method. Chép từ SecurityConfig. */
    private static final List<String[]> PERMIT_ALL = List.of(
            new String[]{"POST", "/api/auth/**"},
            new String[]{"GET", "/api/exam-types/**"},
            new String[]{"GET", "/api/exam-categories/**"},
            new String[]{"GET", "/api/evaluations/**"},
            new String[]{"GET", "/api/tests/**"},
            new String[]{"GET", "/api/posts/**"},
            new String[]{"GET", "/api/categories/**"},
            new String[]{"GET", "/api/tags/**"},
            new String[]{"GET", "/api/recovery-resources/**"},
            new String[]{"GET", "/api/milestones/**"},
            new String[]{"*", "/api/user-tests/guest"},
            new String[]{"*", "/api/user-tests/guest/**"},
            new String[]{"*", "/api/user-tests/*/guest-submit"},
            new String[]{"*", "/api/user-answers/guest/**"},
            new String[]{"POST", "/api/analytics/visit"}
    );

    /**
     * Endpoint public đã được duyệt. Mỗi dòng ở đây là một lời khẳng định: "gọi được mà không
     * đăng nhập là đúng ý đồ". Nhóm theo mục đích cho dễ soát lại.
     */
    private static final Set<String> APPROVED_PUBLIC_ENDPOINTS = Set.of(
            // Đăng nhập / đăng ký / quên mật khẩu. change-password & logout tuy nằm trong
            // /api/auth/** nhưng tự lấy danh tính từ token nên không đăng nhập là hỏng ngay.
            "POST /api/auth/login",
            "POST /api/auth/register",
            "POST /api/auth/refresh",
            "POST /api/auth/logout",
            "POST /api/auth/forgot-password",
            "POST /api/auth/reset-password",
            "POST /api/auth/change-password",

            // Danh mục tra cứu: khách chưa đăng nhập vẫn phải duyệt được kho đề.
            "GET /api/exam-types",
            "GET /api/exam-types/standard",
            "GET /api/exam-types/flexible",
            "GET /api/exam-types/{id}",
            "GET /api/exam-types/{id}/children",
            "GET /api/exam-types/{examTypeId}/layout",
            "GET /api/exam-types/{examTypeId}/layout/own",
            "GET /api/exam-categories",
            "GET /api/exam-categories/{id}",
            "GET /api/exam-categories/by-code/{code}",
            "GET /api/tags/tree/{examTypeId}",
            "GET /api/tags/flat/{examTypeId}",
            "GET /api/tags/question/{questionId}",
            "GET /api/milestones",
            "GET /api/milestones/{id}",

            // Kho tài liệu ôn tập — nội dung học, không phải đáp án đề thi.
            "GET /api/recovery-resources",
            "GET /api/recovery-resources/{resourceId}",
            "GET /api/recovery-resources/{resourceId}/view",
            "GET /api/recovery-resources/by-tag/{tagId}",
            "GET /api/recovery-resources/by-tags",
            "GET /api/recovery-resources/by-part/{examPartId}",
            "GET /api/recovery-resources/by-parts",

            // Blog + đánh giá: nội dung công khai.
            "GET /api/posts",
            "GET /api/posts/me",
            "GET /api/posts/saved",
            "GET /api/posts/{id}",
            "GET /api/posts/{postId}/comments",
            "GET /api/posts/{postId}/reacts",
            "GET /api/posts/{postId}/save",
            "GET /api/categories",
            "GET /api/categories/{id}",
            "GET /api/evaluations",
            "GET /api/evaluations/paged",
            "GET /api/evaluations/me",
            "GET /api/evaluations/{id}",

            // Thông tin đề cho người làm bài. KHÔNG được có endpoint nào trả đáp án đúng ở đây:
            // muốn xem đáp án phải đi qua /api/user-tests/{userTestId}/review-test.
            "GET /api/tests",
            "GET /api/tests/my",
            "GET /api/tests/my-tests",
            "GET /api/tests/my-all-test",
            "GET /api/tests/admin",
            "GET /api/tests/admin/by-exam-type/{examTypeId}",
            "GET /api/tests/admintest/{testId}",
            "GET /api/tests/usertest/{testId}",
            "GET /api/tests/quick-challenge",
            "GET /api/tests/by-class/{classId}",
            "GET /api/tests/collections/by-exam-type/{examTypeId}",
            "GET /api/tests/user/by-exam-type/{examTypeId}",
            "GET /api/tests/user/by-collection/{collectionId}",
            "GET /api/tests/{testId}/can-start",
            "GET /api/tests/{testId}/parts-summary",

            // Luồng làm bài của khách: danh tính là guest session, kiểm tra trong service.
            "POST /api/user-tests/guest",
            "GET /api/user-tests/guest/check-active",
            "GET /api/user-tests/guest/{userTestId}",
            "GET /api/user-tests/guest/{userTestId}/review-test",
            "POST /api/user-tests/{userTestId}/guest-submit",
            "POST /api/user-answers/guest/batch",
            "GET /api/user-answers/guest/user-test/{userTestId}",
            "GET /api/user-answers/guest/user-test/{userTestId}/result",
            "GET /api/user-answers/guest/user-test/{userTestId}/result/enhanced",

            // Đếm lượt truy cập, gọi từ mọi trang kể cả khách.
            "POST /api/analytics/visit"
    );

    private static final Map<String, String> MAPPING_VERBS = Map.of(
            "Get", "GET", "Post", "POST", "Put", "PUT", "Delete", "DELETE", "Patch", "PATCH");

    private static final Pattern CLASS_MAPPING =
            Pattern.compile("@RequestMapping\\(\\s*(?:value\\s*=\\s*)?\"([^\"]*)\"");
    private static final Pattern METHOD_MAPPING =
            Pattern.compile("@(Get|Post|Put|Delete|Patch)Mapping(?:\\(\\s*(?:value\\s*=\\s*)?\"([^\"]*)\")?");

    @Test
    @DisplayName("Không có endpoint public nào ngoài danh sách đã duyệt")
    void publicEndpointsMatchApprovedList() {
        Set<String> actual = scanPublicEndpoints();

        Set<String> unexpected = new TreeSet<>(actual);
        unexpected.removeAll(APPROVED_PUBLIC_ENDPOINTS);
        Set<String> stale = new TreeSet<>(APPROVED_PUBLIC_ENDPOINTS);
        stale.removeAll(actual);

        assertEquals(new TreeSet<>(APPROVED_PUBLIC_ENDPOINTS), new TreeSet<>(actual),
                "\nEndpoint public MỚI chưa được duyệt (gắn kiểm tra quyền, hoặc thêm vào "
                        + "APPROVED_PUBLIC_ENDPOINTS nếu công khai là đúng ý):\n  " + String.join("\n  ", unexpected)
                        + "\n\nEndpoint trong danh sách nhưng không còn tồn tại (xoá khỏi danh sách):\n  "
                        + String.join("\n  ", stale) + "\n");
    }

    private Set<String> scanPublicEndpoints() {
        AntPathMatcher matcher = new AntPathMatcher();
        Path root = Path.of("src", "main", "java");

        try (Stream<Path> files = Files.walk(root)) {
            return files
                    .filter(path -> path.getFileName().toString().endsWith("Controller.java"))
                    .flatMap(this::endpointsOf)
                    .filter(endpoint -> isPermitAll(matcher, endpoint))
                    .collect(Collectors.toCollection(TreeSet::new));
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    private Stream<String> endpointsOf(Path file) {
        String source;
        try {
            source = Files.readString(file);
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }

        Matcher classMatcher = CLASS_MAPPING.matcher(source);
        String base = classMatcher.find() ? classMatcher.group(1) : "";

        return METHOD_MAPPING.matcher(source).results()
                .map(result -> {
                    String verb = MAPPING_VERBS.get(result.group(1));
                    String sub = result.group(2) == null ? "" : result.group(2);
                    String path = (base + sub).isEmpty() ? "/" : base + sub;
                    return verb + " " + path;
                });
    }

    private boolean isPermitAll(AntPathMatcher matcher, String endpoint) {
        String[] parts = endpoint.split(" ", 2);
        String verb = parts[0];
        String path = parts[1];

        return PERMIT_ALL.stream().anyMatch(rule ->
                (rule[0].equals("*") || rule[0].equals(verb)) && matcher.match(rule[1], path));
    }
}
