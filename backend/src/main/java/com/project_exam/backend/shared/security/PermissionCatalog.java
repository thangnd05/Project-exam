package com.project_exam.backend.shared.security;

import java.util.List;

public final class PermissionCatalog {

    private PermissionCatalog() {}

    public record Def(String code, String groupName, String description) {}

    public static final String USER_MANAGE = "USER:MANAGE";
    public static final String ROLE_MANAGE = "ROLE:MANAGE";

    public static final String EXAM_TYPE_MANAGE = "EXAM_TYPE:MANAGE";
    public static final String EXAM_TYPE_LAYOUT_MANAGE = "EXAM_TYPE:LAYOUT";
    public static final String EXAM_CATEGORY_MANAGE = "EXAM_CATEGORY:MANAGE";
    public static final String EXAM_PART_MANAGE = "EXAM_PART:MANAGE";
    public static final String SKILL_MANAGE = "SKILL:MANAGE";
    public static final String PASSAGE_MANAGE = "PASSAGE:MANAGE";
    public static final String PASSAGE_MEDIA_MANAGE = "PASSAGE_MEDIA:MANAGE";
    public static final String ANSWER_VIEW = "ANSWER:VIEW";
    public static final String ANSWER_MANAGE = "ANSWER:MANAGE";
    public static final String TAG_MANAGE = "TAG:MANAGE";
    public static final String SCORING_CONVERSION_MANAGE = "SCORING_CONVERSION:MANAGE";
    public static final String QUESTION_COLLECTION_MANAGE = "QUESTION_COLLECTION:MANAGE";
    public static final String QUESTION_MANAGE = "QUESTION:MANAGE";
    public static final String MILESTONE_MANAGE = "MILESTONE:MANAGE";
    public static final String RECOVERY_RESOURCE_MANAGE = "RECOVERY_RESOURCE:MANAGE";

    public static final String TEST_MANAGE = "TEST:MANAGE";
    public static final String TEST_MANAGE_PRICING = "TEST:MANAGE_PRICING";
    public static final String ATTEMPT_MANAGE = "ATTEMPT:MANAGE";
    public static final String EVALUATION_MANAGE = "EVALUATION:MANAGE";

    public static final String POST_MODERATE = "POST:MODERATE";
    public static final String POST_CATEGORY_MANAGE = "POST_CATEGORY:MANAGE";
    public static final String VOCABULARY_MANAGE = "VOCABULARY:MANAGE";

    public static final String CLASS_MANAGE = "CLASS:MANAGE";

    public static final String QUEST_MANAGE = "QUEST:MANAGE";
    public static final String COSMETIC_MANAGE = "COSMETIC:MANAGE";
    public static final String COIN_MANAGE = "COIN:MANAGE";
    public static final String STREAK_CONFIG_MANAGE = "STREAK_CONFIG:MANAGE";

    public static final String AUDIT_VIEW = "AUDIT:VIEW";
    public static final String DASHBOARD_VIEW = "DASHBOARD:VIEW";

    private static final String G_USER = "Người dùng & phân quyền";
    private static final String G_EXAM = "Đề thi & nội dung kiểm tra";
    private static final String G_TEST = "Bài kiểm tra & lượt làm";
    private static final String G_CONTENT = "Bài viết & từ vựng";
    private static final String G_CLASS = "Lớp học";
    private static final String G_GAME = "Game hóa";
    private static final String G_SYSTEM = "Hệ thống";

    public static final List<Def> ALL = List.of(
            new Def(USER_MANAGE, G_USER, "Quản lý người dùng (tạo/sửa/xóa, đổi vai trò)"),
            new Def(ROLE_MANAGE, G_USER, "Quản lý vai trò và gán quyền"),

            new Def(EXAM_TYPE_MANAGE, G_EXAM, "Quản lý loại đề"),
            new Def(EXAM_TYPE_LAYOUT_MANAGE, G_EXAM, "Thiết kế giao diện làm bài theo loại đề (kéo-thả bố cục)"),
            new Def(EXAM_CATEGORY_MANAGE, G_EXAM, "Quản lý nhóm đề"),
            new Def(EXAM_PART_MANAGE, G_EXAM, "Quản lý phần thi"),
            new Def(SKILL_MANAGE, G_EXAM, "Quản lý kỹ năng"),
            new Def(PASSAGE_MANAGE, G_EXAM, "Quản lý đoạn văn/bài đọc"),
            new Def(PASSAGE_MEDIA_MANAGE, G_EXAM, "Quản lý media của đoạn văn"),
            new Def(ANSWER_VIEW, G_EXAM, "Xem đáp án"),
            new Def(ANSWER_MANAGE, G_EXAM, "Quản lý đáp án"),
            new Def(TAG_MANAGE, G_EXAM, "Quản lý tag"),
            new Def(SCORING_CONVERSION_MANAGE, G_EXAM, "Quản lý bảng quy đổi điểm"),
            new Def(QUESTION_COLLECTION_MANAGE, G_EXAM, "Quản lý bộ sưu tập câu hỏi"),
            new Def(QUESTION_MANAGE, G_EXAM, "Quản lý mọi câu hỏi (ghi đè quyền sở hữu)"),
            new Def(MILESTONE_MANAGE, G_EXAM, "Quản lý mốc mục tiêu"),
            new Def(RECOVERY_RESOURCE_MANAGE, G_EXAM, "Quản lý tài nguyên ôn tập"),

            new Def(TEST_MANAGE, G_TEST, "Quản lý mọi bài kiểm tra (ghi đè quyền sở hữu)"),
            new Def(TEST_MANAGE_PRICING, G_TEST, "Đặt giá xu cho bài kiểm tra công khai"),
            new Def(ATTEMPT_MANAGE, G_TEST, "Xem/quản lý lượt làm bài của mọi người"),
            new Def(EVALUATION_MANAGE, G_TEST, "Quản lý mọi đánh giá (ghi đè quyền sở hữu)"),

            new Def(POST_MODERATE, G_CONTENT, "Kiểm duyệt bài viết (đổi trạng thái, xóa bài người khác)"),
            new Def(POST_CATEGORY_MANAGE, G_CONTENT, "Quản lý danh mục bài viết"),
            new Def(VOCABULARY_MANAGE, G_CONTENT, "Quản lý từ vựng hệ thống"),

            new Def(CLASS_MANAGE, G_CLASS, "Quản lý mọi lớp học (ghi đè quyền giáo viên)"),

            new Def(QUEST_MANAGE, G_GAME, "Quản lý nhiệm vụ"),
            new Def(COSMETIC_MANAGE, G_GAME, "Quản lý vật phẩm trang trí"),
            new Def(COIN_MANAGE, G_GAME, "Quản lý xu người dùng"),
            new Def(STREAK_CONFIG_MANAGE, G_GAME, "Quản lý cấu hình streak"),

            new Def(AUDIT_VIEW, G_SYSTEM, "Xem nhật ký hoạt động"),
            new Def(DASHBOARD_VIEW, G_SYSTEM, "Xem tổng quan Dashboard quản trị (thống kê hệ thống)")
    );
}
