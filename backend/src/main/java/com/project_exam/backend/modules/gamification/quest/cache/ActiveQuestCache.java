package com.project_exam.backend.modules.gamification.quest.cache;

import com.project_exam.backend.infrastructure.cache.CacheNames;
import com.project_exam.backend.modules.gamification.quest.domain.Quest;
import com.project_exam.backend.modules.gamification.quest.repository.QuestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ActiveQuestCache {

    private final QuestRepository questRepository;

    // Header gọi danh sách nhiệm vụ ở mọi trang nên giữ phần chung trong Redis; startAt/endAt vẫn lọc
    // theo giờ lúc đọc. Bản lấy ra là entity đã tách khỏi session, chỉ dùng để đọc, không save lại.
    // Sửa thẳng trong DB (không qua JPA) thì phải chờ hết TTL hoặc xoá key cache:activeQuests::*.
    @Cacheable(cacheNames = CacheNames.ACTIVE_QUESTS, key = "'all'", sync = true)
    public List<Quest> getActive() {
        return questRepository.findByActiveTrueOrderByCreatedAtDesc();
    }
}
