package com.project_exam.backend.modules.assessment.test.dto;

import lombok.Data;

@Data
public class AddRandomQuestionsToTestRequest {

    private String testPartId;
    /** Số câu muốn lấy random/tuần tự từ kho (tối đa bằng số câu thực tế thêm được). */
    private Integer count;
    /** Lọc theo lớp (optional). Null = lấy từ toàn bộ part. */
    private String classId;
    /** Lọc theo chapter (optional). Chỉ dùng khi classId != null. */
    private String chapterId;
    /** Nếu true, lấy tuần tự từ trên xuống thay vì random */
    private Boolean isSequential;
    /** Vị trí bắt đầu (1-based) khi isSequential = true */
    private Integer fromIndex;
    /** Vị trí kết thúc (1-based) khi isSequential = true */
    private Integer toIndex;
    /** Nguồn kho: "admin" để lấy từ kho do admin tạo (public). Bỏ trống = kho cá nhân/lớp. */
    private String bank;
    /**
     * Giới hạn ứng viên trong một Bộ đề (collection). Null/blank = không lọc theo bộ đề (toàn kho).
     * Nếu là bộ đề cha thì gồm luôn câu của các bộ đề con trực tiếp.
     */
    private String collectionId;
}
