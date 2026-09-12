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

class PublicEndpointApprovalTest {

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
            new String[]{"GET", "/api/certificates/verify/**"},
            new String[]{"*", "/api/user-tests/guest"},
            new String[]{"*", "/api/user-tests/guest/**"},
            new String[]{"*", "/api/user-tests/*/guest-submit"},
            new String[]{"*", "/api/user-answers/guest/**"},
            new String[]{"POST", "/api/analytics/visit"}
    );

    private static final Set<String> APPROVED_PUBLIC_ENDPOINTS = Set.of(

            "POST /api/auth/login",
            "POST /api/auth/register",
            "POST /api/auth/refresh",
            "POST /api/auth/logout",
            "POST /api/auth/forgot-password",
            "POST /api/auth/reset-password",
            "POST /api/auth/change-password",

            "GET /api/exam-types",
            "GET /api/exam-types/standard",
            "GET /api/exam-types/flexible",
            "GET /api/exam-types/{id}",
            "GET /api/exam-types/{id}/children",
            "GET /api/exam-types/{examTypeId}/layout",
            "GET /api/exam-categories",
            "GET /api/exam-categories/{id}",
            "GET /api/exam-categories/by-code/{code}",
            "GET /api/tags/tree/{examTypeId}",
            "GET /api/tags/flat/{examTypeId}",
            "GET /api/tags/question/{questionId}",
            "GET /api/milestones",
            "GET /api/milestones/{id}",

            "GET /api/recovery-resources",
            "GET /api/recovery-resources/{resourceId}",
            "GET /api/recovery-resources/{resourceId}/view",
            "GET /api/recovery-resources/by-tag/{tagId}",
            "GET /api/recovery-resources/by-tags",
            "GET /api/recovery-resources/by-part/{examPartId}",
            "GET /api/recovery-resources/by-parts",

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

            "GET /api/tests",
            "GET /api/tests/my",
            "GET /api/tests/my-tests",
            "GET /api/tests/my-all-test",
            "GET /api/tests/admintest/{testId}",
            "GET /api/tests/usertest/{testId}",
            "GET /api/tests/quick-challenge",
            "GET /api/tests/by-class/{classId}",
            "GET /api/tests/certificate-exams/by-exam-type/{examTypeId}",
            "GET /api/tests/collections/by-exam-type/{examTypeId}",
            "GET /api/tests/user/by-exam-type/{examTypeId}",
            "GET /api/tests/user/by-collection/{collectionId}",
            "GET /api/tests/{testId}/can-start",
            "GET /api/tests/{testId}/parts-summary",

            "POST /api/user-tests/guest",
            "GET /api/user-tests/guest/check-active",
            "GET /api/user-tests/guest/{userTestId}",
            "GET /api/user-tests/guest/{userTestId}/review-test",
            "POST /api/user-tests/{userTestId}/guest-submit",
            "POST /api/user-answers/guest/batch",
            "GET /api/user-answers/guest/user-test/{userTestId}",
            "GET /api/user-answers/guest/user-test/{userTestId}/result",
            "GET /api/user-answers/guest/user-test/{userTestId}/result/enhanced",

            "GET /api/certificates/verify/{code}",

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
