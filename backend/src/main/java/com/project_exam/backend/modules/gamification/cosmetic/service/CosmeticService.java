package com.project_exam.backend.modules.gamification.cosmetic.service;

import com.project_exam.backend.modules.gamification.coin.service.CoinService;
import com.project_exam.backend.modules.gamification.cosmetic.domain.Cosmetic;
import com.project_exam.backend.modules.gamification.cosmetic.domain.CosmeticType;
import com.project_exam.backend.modules.gamification.cosmetic.domain.UserCosmetic;
import com.project_exam.backend.modules.gamification.cosmetic.dto.CosmeticRequest;
import com.project_exam.backend.modules.gamification.cosmetic.dto.CosmeticResponse;
import com.project_exam.backend.modules.gamification.cosmetic.dto.EquippedCosmeticsResponse;
import com.project_exam.backend.modules.gamification.cosmetic.mapper.CosmeticMapper;
import com.project_exam.backend.modules.gamification.cosmetic.repository.CosmeticRepository;
import com.project_exam.backend.modules.gamification.cosmetic.repository.UserCosmeticRepository;
import com.project_exam.backend.shared.exception.BadRequestException;
import com.project_exam.backend.shared.exception.ConflictException;
import com.project_exam.backend.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CosmeticService {

    private final CosmeticRepository cosmeticRepository;
    private final UserCosmeticRepository userCosmeticRepository;
    private final CoinService coinService;
    private final CosmeticMapper cosmeticMapper;

    // ---------------- User ----------------

    /** Cửa hàng: cosmetic đang bật + cờ owned/equipped của user. */
    @Transactional(readOnly = true)
    public List<CosmeticResponse> getShopForUser(String userId) {
        Map<String, UserCosmetic> ownedById = userCosmeticRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(UserCosmetic::getCosmeticId, uc -> uc));

        return cosmeticRepository.findByActiveTrueOrderByDisplayOrderAscCreatedAtAsc().stream()
                .map(cosmetic -> {
                    UserCosmetic owned = ownedById.get(cosmetic.getCosmeticId());
                    return cosmeticMapper.toResponse(cosmetic, owned != null, owned != null && Boolean.TRUE.equals(owned.getEquipped()));
                })
                .toList();
    }

    /** Cosmetic user đang đeo — để hiển thị quanh avatar. */
    @Transactional(readOnly = true)
    public EquippedCosmeticsResponse getEquipped(String userId) {
        List<UserCosmetic> equipped = userCosmeticRepository.findByUserIdAndEquippedTrue(userId);
        if (equipped.isEmpty()) {
            return EquippedCosmeticsResponse.builder().build();
        }

        Set<String> ids = equipped.stream().map(UserCosmetic::getCosmeticId).collect(Collectors.toSet());
        Map<String, Cosmetic> byId = cosmeticRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Cosmetic::getCosmeticId, c -> c));

        EquippedCosmeticsResponse.EquippedCosmeticsResponseBuilder builder = EquippedCosmeticsResponse.builder();
        for (UserCosmetic uc : equipped) {
            Cosmetic c = byId.get(uc.getCosmeticId());
            if (c == null) continue;
            CosmeticResponse res = cosmeticMapper.toResponse(c, true, true);
            if (c.getType() == CosmeticType.FRAME) builder.frame(res);
            else if (c.getType() == CosmeticType.BADGE) builder.badge(res);
        }
        return builder.build();
    }

    /** Cosmetic đang đeo của NHIỀU user 1 lần (tránh N+1) — vd hiển thị avatar tác giả comment/bài viết. */
    @Transactional(readOnly = true)
    public Map<String, EquippedCosmeticsResponse> getEquippedForUsers(java.util.Collection<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        List<UserCosmetic> equipped = userCosmeticRepository.findByUserIdInAndEquippedTrue(userIds);
        if (equipped.isEmpty()) {
            return Map.of();
        }

        Set<String> cosmeticIds = equipped.stream().map(UserCosmetic::getCosmeticId).collect(Collectors.toSet());
        Map<String, Cosmetic> byId = cosmeticRepository.findAllById(cosmeticIds).stream()
                .collect(Collectors.toMap(Cosmetic::getCosmeticId, c -> c));

        Map<String, EquippedCosmeticsResponse.EquippedCosmeticsResponseBuilder> builders = new java.util.HashMap<>();
        for (UserCosmetic uc : equipped) {
            Cosmetic c = byId.get(uc.getCosmeticId());
            if (c == null) continue;
            var builder = builders.computeIfAbsent(uc.getUserId(), k -> EquippedCosmeticsResponse.builder());
            CosmeticResponse res = cosmeticMapper.toResponse(c, true, true);
            if (c.getType() == CosmeticType.FRAME) builder.frame(res);
            else if (c.getType() == CosmeticType.BADGE) builder.badge(res);
        }

        Map<String, EquippedCosmeticsResponse> result = new java.util.HashMap<>();
        builders.forEach((userId, b) -> result.put(userId, b.build()));
        return result;
    }

    /** Mua cosmetic bằng xu. */
    @Transactional
    public CosmeticResponse buy(String userId, String cosmeticId) {
        Cosmetic cosmetic = cosmeticRepository.findById(cosmeticId)
                .orElseThrow(() -> new NotFoundException("Vật phẩm không tồn tại"));
        if (Boolean.FALSE.equals(cosmetic.getActive())) {
            throw new BadRequestException("Vật phẩm hiện không bán");
        }
        if (userCosmeticRepository.existsByUserIdAndCosmeticId(userId, cosmeticId)) {
            throw new ConflictException("Bạn đã sở hữu vật phẩm này");
        }

        coinService.spend(userId, cosmetic.getCostCoins());

        UserCosmetic owned = new UserCosmetic();
        owned.setUserId(userId);
        owned.setCosmeticId(cosmeticId);
        owned.setEquipped(false);
        owned.setOwnedAt(LocalDateTime.now());
        userCosmeticRepository.save(owned);

        return cosmeticMapper.toResponse(cosmetic, true, false);
    }

    /** Đeo cosmetic (tự tháo cái cùng loại đang đeo). */
    @Transactional
    public void equip(String userId, String cosmeticId) {
        UserCosmetic target = userCosmeticRepository.findByUserIdAndCosmeticId(userId, cosmeticId)
                .orElseThrow(() -> new BadRequestException("Bạn chưa sở hữu vật phẩm này"));
        Cosmetic cosmetic = cosmeticRepository.findById(cosmeticId)
                .orElseThrow(() -> new NotFoundException("Vật phẩm không tồn tại"));

        // Tháo các cosmetic cùng loại đang đeo.
        List<UserCosmetic> equipped = userCosmeticRepository.findByUserIdAndEquippedTrue(userId);
        if (!equipped.isEmpty()) {
            Set<String> sameTypeIds = cosmeticRepository.findAllById(
                            equipped.stream().map(UserCosmetic::getCosmeticId).collect(Collectors.toSet()))
                    .stream()
                    .filter(c -> c.getType() == cosmetic.getType())
                    .map(Cosmetic::getCosmeticId)
                    .collect(Collectors.toSet());
            for (UserCosmetic uc : equipped) {
                if (sameTypeIds.contains(uc.getCosmeticId())) {
                    uc.setEquipped(false);
                    userCosmeticRepository.save(uc);
                }
            }
        }

        target.setEquipped(true);
        userCosmeticRepository.save(target);
    }

    /** Tháo cosmetic. */
    @Transactional
    public void unequip(String userId, String cosmeticId) {
        UserCosmetic target = userCosmeticRepository.findByUserIdAndCosmeticId(userId, cosmeticId)
                .orElseThrow(() -> new BadRequestException("Bạn chưa sở hữu vật phẩm này"));
        target.setEquipped(false);
        userCosmeticRepository.save(target);
    }

    // ---------------- Admin ----------------

    @Transactional(readOnly = true)
    public List<CosmeticResponse> findAll() {
        return cosmeticRepository.findAllByOrderByDisplayOrderAscCreatedAtAsc().stream()
                .map(c -> cosmeticMapper.toResponse(c, null, null))
                .toList();
    }

    @Transactional
    public CosmeticResponse create(CosmeticRequest request) {
        Cosmetic cosmetic = new Cosmetic();
        applyRequest(cosmetic, request);
        cosmetic.setCreatedAt(LocalDateTime.now());
        return cosmeticMapper.toResponse(cosmeticRepository.save(cosmetic), null, null);
    }

    @Transactional
    public CosmeticResponse update(String cosmeticId, CosmeticRequest request) {
        Cosmetic cosmetic = cosmeticRepository.findById(cosmeticId)
                .orElseThrow(() -> new NotFoundException("Vật phẩm không tồn tại"));
        applyRequest(cosmetic, request);
        return cosmeticMapper.toResponse(cosmeticRepository.save(cosmetic), null, null);
    }

    @Transactional
    public void delete(String cosmeticId) {
        Cosmetic cosmetic = cosmeticRepository.findById(cosmeticId)
                .orElseThrow(() -> new NotFoundException("Vật phẩm không tồn tại"));
        cosmeticRepository.delete(cosmetic);
    }

    // ---------------- Helpers ----------------

    private void applyRequest(Cosmetic cosmetic, CosmeticRequest request) {
        cosmetic.setName(request.getName());
        cosmetic.setDescription(request.getDescription());
        cosmetic.setType(request.getType());
        cosmetic.setCostCoins(request.getCostCoins());
        cosmetic.setAssetValue(request.getAssetValue());
        cosmetic.setFrameStyle(request.getFrameStyle());
        cosmetic.setImageUrl(request.getImageUrl());
        cosmetic.setActive(request.getActive() == null ? true : request.getActive());
        cosmetic.setDisplayOrder(request.getDisplayOrder() == null ? 0 : request.getDisplayOrder());
    }
}
