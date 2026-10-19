package com.project_exam.backend.infrastructure.cache;

public final class CacheNames {

    public static final String TEST_PAPER = "testPaper";

    // Dữ liệu danh mục: ai xem cũng giống nhau, admin ít sửa.
    public static final String EXAM_TYPES = "examTypes";
    public static final String EXAM_TYPE = "examType";
    public static final String EXAM_CATEGORIES = "examCategories";
    public static final String EXAM_PARTS = "examParts";

    // Bảng xếp hạng công khai: truy vấn nặng, chấp nhận chậm vài chục giây nên không xoá theo lượt ghi.
    public static final String HALL_OF_FAME = "hallOfFame";
    public static final String STREAK_LEADERBOARD = "streakLeaderboard";

    private CacheNames() {
    }
}
