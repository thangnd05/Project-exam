package com.project_exam.backend.modules.gamification.cosmetic.controller;

import com.project_exam.backend.modules.gamification.cosmetic.dto.CosmeticResponse;
import com.project_exam.backend.modules.gamification.cosmetic.dto.EquippedCosmeticsResponse;
import com.project_exam.backend.modules.gamification.cosmetic.service.CosmeticService;
import com.project_exam.backend.shared.util.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cosmetics")
@AllArgsConstructor
public class CosmeticController {

    private final CosmeticService cosmeticService;
    private final AuthUtils authUtils;

    // Cửa hàng: danh sách cosmetic + trạng thái owned/equipped
    @GetMapping
    public ResponseEntity<List<CosmeticResponse>> getShop(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(cosmeticService.getShopForUser(userId));
    }

    // Cosmetic đang đeo (để hiển thị quanh avatar)
    @GetMapping("/me/equipped")
    public ResponseEntity<EquippedCosmeticsResponse> getEquipped(HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(cosmeticService.getEquipped(userId));
    }

    @PostMapping("/{cosmeticId}/buy")
    public ResponseEntity<CosmeticResponse> buy(
            @PathVariable String cosmeticId, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        return ResponseEntity.ok(cosmeticService.buy(userId, cosmeticId));
    }

    @PostMapping("/{cosmeticId}/equip")
    public ResponseEntity<Void> equip(
            @PathVariable String cosmeticId, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        cosmeticService.equip(userId, cosmeticId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{cosmeticId}/unequip")
    public ResponseEntity<Void> unequip(
            @PathVariable String cosmeticId, HttpServletRequest httpRequest) {
        String userId = authUtils.getUserId(httpRequest);
        cosmeticService.unequip(userId, cosmeticId);
        return ResponseEntity.noContent().build();
    }
}
