package com.project_exam.backend.modules.admin.exam.controller;

import com.project_exam.backend.modules.assessment.exam.domain.Question;
import com.project_exam.backend.modules.assessment.exam.dto.AdminQuestionListItemResponse;
import com.project_exam.backend.modules.assessment.exam.dto.BulkUpdateQuestionsRequest;
import com.project_exam.backend.modules.assessment.exam.dto.BulkUpdateQuestionsResponse;
import com.project_exam.backend.modules.assessment.exam.dto.QuestionAdminResponse;
import com.project_exam.backend.modules.assessment.exam.service.AdminQuestionService;
import com.project_exam.backend.modules.assessment.exam.service.QuestionService;
import com.project_exam.backend.shared.dto.PageResponse;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Mặt quản trị của ngân hàng câu hỏi, tách khỏi {@link QuestionController} theo
 * đúng cách gamification đang làm (QuestAdminController, CoinAdminController...):
 * cùng module, cùng service/repository/domain, chỉ tách controller theo đối tượng
 * dùng. Mọi method ở đây đều cần đúng một quyền nên khó sót requirePermission hơn
 * là trộn lẫn với các endpoint của học viên/giáo viên.
 *
 * Lưu ý: SecurityConfig KHÔNG có luật riêng cho /api/admin/**, quyền vẫn do
 * requirePermission trong từng method quyết định - đổi path không tự làm nó an toàn hơn.
 */
@RestController
@RequestMapping("/api/admin/questions")
@RequiredArgsConstructor
public class QuestionAdminController {

    private final QuestionService questionService;
    private final AdminQuestionService adminQuestionService;
    private final AuthUtils authUtils;

    /**
     * Bảng quản lý câu hỏi: phân trang + lọc.
     */
    @GetMapping("/search")
    public ResponseEntity<PageResponse<AdminQuestionListItemResponse>> search(
            @RequestParam(required = false) String examTypeId,
            @RequestParam(required = false) String examPartId,
            @RequestParam(required = false) String collectionId,
            @RequestParam(required = false) Question.UsageScope usageScope,
            @RequestParam(required = false) Question.QuestionType questionType,
            @RequestParam(required = false) Boolean isBank,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
        return ResponseEntity.ok(adminQuestionService.search(
                examTypeId, examPartId, collectionId, usageScope, questionType, isBank,
                keyword, page, size));
    }

    /** Sửa hàng loạt thuộc tính chung (mục đích sử dụng, bộ sưu tập, cờ kho). */
    @PatchMapping("/bulk")
    public ResponseEntity<BulkUpdateQuestionsResponse> bulkUpdate(
            @Valid @RequestBody BulkUpdateQuestionsRequest request
    ) {
        authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
        return ResponseEntity.ok(adminQuestionService.bulkUpdate(request));
    }

    /**
     * Trả TOÀN BỘ ngân hàng trong một lượt, không phân trang.
     *
     * Giữ lại vì trước đây nằm ở GET /api/questions, nhưng {@link #search} đã thay
     * thế hoàn toàn và không FE nào còn gọi cái này. Bỏ được thì nên bỏ.
     */
    @Deprecated
    @GetMapping("/all")
    public ResponseEntity<List<QuestionAdminResponse>> getAll() {
        authUtils.requirePermission(PermissionCatalog.QUESTION_MANAGE);
        return ResponseEntity.ok(questionService.findAllAdminSummaries());
    }
}
