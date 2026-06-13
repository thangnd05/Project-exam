package com.project_exam.backend.modules.gamification.quest.service;

import com.project_exam.backend.modules.gamification.coin.service.CoinService;
import com.project_exam.backend.modules.gamification.quest.domain.Quest;
import com.project_exam.backend.modules.gamification.quest.domain.QuestConditionType;
import com.project_exam.backend.modules.gamification.quest.domain.UserQuestClaim;
import com.project_exam.backend.modules.gamification.quest.dto.QuestClaimResponse;
import com.project_exam.backend.modules.gamification.quest.dto.QuestRequest;
import com.project_exam.backend.modules.gamification.quest.dto.QuestResponse;
import com.project_exam.backend.modules.gamification.quest.dto.UserQuestResponse;
import com.project_exam.backend.modules.gamification.quest.mapper.QuestMapper;
import com.project_exam.backend.modules.gamification.quest.repository.QuestRepository;
import com.project_exam.backend.modules.gamification.quest.repository.UserQuestClaimRepository;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestService {

    private final QuestRepository questRepository;
    private final UserQuestClaimRepository claimRepository;
    private final QuestConditionEvaluator evaluator;
    private final CoinService coinService;
    private final QuestMapper questMapper;

    // ---------------- User ----------------

    /** Nhiệm vụ user nhìn thấy: đang bật + trong thời gian hiệu lực (ẩn hết hạn / chưa mở). */
    @Transactional(readOnly = true)
    public List<UserQuestResponse> getAvailableForUser(String userId) {
        LocalDateTime now = LocalDateTime.now();
        Set<String> claimedQuestIds = claimRepository.findByUserId(userId).stream()
                .map(UserQuestClaim::getQuestId)
                .collect(Collectors.toSet());

        return questRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(quest -> isVisible(quest, now))
                .map(quest -> toUserResponse(quest, userId, claimedQuestIds.contains(quest.getQuestId())))
                .toList();
    }

    /** User nhận xu của 1 nhiệm vụ. */
    @Transactional
    public QuestClaimResponse claim(String userId, String questId) {
        Quest quest = questRepository.findById(questId)
                .orElseThrow(() -> new NotFoundException("Nhiệm vụ không tồn tại"));

        LocalDateTime now = LocalDateTime.now();
        if (Boolean.FALSE.equals(quest.getActive())) {
            throw new BadRequestException("Nhiệm vụ chưa được mở");
        }
        if (quest.getStartAt() != null && now.isBefore(quest.getStartAt())) {
            throw new BadRequestException("Nhiệm vụ chưa bắt đầu");
        }
        if (quest.getEndAt() != null && now.isAfter(quest.getEndAt())) {
            throw new BadRequestException("Nhiệm vụ đã hết hạn");
        }
        if (claimRepository.existsByUserIdAndQuestId(userId, questId)) {
            throw new ConflictException("Bạn đã nhận nhiệm vụ này rồi");
        }

        QuestConditionEvaluator.Progress progress = evaluator.evaluate(quest, userId);
        if (!progress.isSatisfied()) {
            throw new BadRequestException("Bạn chưa hoàn thành điều kiện của nhiệm vụ");
        }

        int newBalance = coinService.addCoins(userId, quest.getRewardCoins());

        UserQuestClaim claim = new UserQuestClaim();
        claim.setUserId(userId);
        claim.setQuestId(questId);
        claim.setRewardCoins(quest.getRewardCoins());
        claim.setClaimedAt(now);
        claimRepository.save(claim);

        return questMapper.toClaimResponse(questId, quest.getRewardCoins(), newBalance);
    }

    // ---------------- Admin ----------------

    @Transactional(readOnly = true)
    public List<QuestResponse> findAll() {
        return questRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toAdminResponse)
                .toList();
    }

    @Transactional
    public QuestResponse create(QuestRequest request) {
        Quest quest = new Quest();
        applyRequest(quest, request);
        quest.setCreatedAt(LocalDateTime.now());
        return toAdminResponse(questRepository.save(quest));
    }

    @Transactional
    public QuestResponse update(String questId, QuestRequest request) {
        Quest quest = questRepository.findById(questId)
                .orElseThrow(() -> new NotFoundException("Nhiệm vụ không tồn tại"));
        applyRequest(quest, request);
        return toAdminResponse(questRepository.save(quest));
    }

    @Transactional
    public void delete(String questId) {
        Quest quest = questRepository.findById(questId)
                .orElseThrow(() -> new NotFoundException("Nhiệm vụ không tồn tại"));
        questRepository.delete(quest);
    }

    // ---------------- Helpers ----------------

    private void applyRequest(Quest quest, QuestRequest request) {
        quest.setTitle(request.getTitle());
        quest.setDescription(request.getDescription());
        quest.setRewardCoins(request.getRewardCoins());
        quest.setConditionType(request.getConditionType());
        quest.setConditionTarget(
                request.getConditionTarget() == null ? 1 : request.getConditionTarget());
        quest.setStartAt(request.getStartAt());
        quest.setEndAt(request.getEndAt());
        quest.setActive(request.getActive() == null ? true : request.getActive());
    }

    private boolean isVisible(Quest quest, LocalDateTime now) {
        if (Boolean.FALSE.equals(quest.getActive())) return false;
        if (quest.getStartAt() != null && now.isBefore(quest.getStartAt())) return false;
        if (quest.getEndAt() != null && now.isAfter(quest.getEndAt())) return false;
        return true;
    }

    private UserQuestResponse toUserResponse(Quest quest, String userId, boolean claimed) {
        QuestConditionEvaluator.Progress progress = evaluator.evaluate(quest, userId);
        boolean eligible = !claimed && progress.isSatisfied();
        return questMapper.toUserResponse(
                quest, progress.getCurrent(), progress.getTarget(), claimed, eligible);
    }

    private QuestResponse toAdminResponse(Quest quest) {
        return questMapper.toAdminResponse(quest, claimRepository.countByQuestId(quest.getQuestId()));
    }
}
