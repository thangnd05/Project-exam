package com.project_exam.backend.modules.assessment.test.cache;

import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import lombok.RequiredArgsConstructor;

// Gắn vào mọi entity tạo nên nội dung đề để mọi đường ghi qua JPA đều xoá cache, kể cả import và xoá mềm.
// Hibernate tạo listener qua Spring (SpringBeanContainer) nên inject được bean.
// Câu @Modifying JPQL/native bỏ qua listener: ghi vào các bảng này kiểu đó thì phải tự gọi evictAllAfterCommit().
@RequiredArgsConstructor
public class TestPaperCacheEvictListener {

    private final TestPaperCache testPaperCache;

    @PostPersist
    @PostUpdate
    @PostRemove
    void onContentChanged(Object entity) {
        testPaperCache.evictAllAfterCommit();
    }
}
