package com.project_exam.backend.dto.request;

import lombok.Data;

@Data
public class AddRandomQuestionsToTestRequest {

    private String testPartId;
    /** Số câu muốn lấy random từ kho (tối đa bằng số câu thực tế thêm được). */
    private Integer count;
    /** Lọc theo lớp (optional). Null = lấy từ toàn bộ part. */
    private String classId;
    /** Lọc theo chapter (optional). Chỉ dùng khi classId != null. */
    private String chapterId;
}
