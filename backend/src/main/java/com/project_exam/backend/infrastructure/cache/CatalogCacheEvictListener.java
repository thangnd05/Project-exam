package com.project_exam.backend.infrastructure.cache;

import com.project_exam.backend.modules.assessment.exam.domain.ExamCategory;
import com.project_exam.backend.modules.assessment.exam.domain.ExamPart;
import com.project_exam.backend.modules.assessment.exam.domain.ExamType;
import com.project_exam.backend.modules.gamification.quest.domain.Quest;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;

import java.util.Map;

// Gắn vào các entity danh mục để mọi đường ghi qua JPA (kể cả import, xoá mềm) đều xoá cache tương ứng.
// Câu @Modifying JPQL/native bỏ qua listener: ghi vào các bảng này kiểu đó thì phải tự gọi CacheEvictor.
@RequiredArgsConstructor
public class CatalogCacheEvictListener {

    // Sửa một loại kỳ thi làm đổi cả parentName/childCount của loại khác nên xoá cả hai cache.
    private static final Map<Class<?>, String[]> CACHES_BY_ENTITY = Map.of(
            ExamType.class, new String[]{CacheNames.EXAM_TYPES, CacheNames.EXAM_TYPE},
            ExamCategory.class, new String[]{CacheNames.EXAM_CATEGORIES},
            ExamPart.class, new String[]{CacheNames.EXAM_PARTS},
            Quest.class, new String[]{CacheNames.ACTIVE_QUESTS}
    );

    private final CacheEvictor cacheEvictor;

    @PostPersist
    @PostUpdate
    @PostRemove
    void onCatalogChanged(Object entity) {
        String[] cacheNames = CACHES_BY_ENTITY.get(Hibernate.getClass(entity));
        if (cacheNames != null) {
            cacheEvictor.clearAfterCommit(cacheNames);
        }
    }
}
