package com.project_exam.backend.modules.admin.gamification.controller;
import com.project_exam.backend.shared.security.PermissionCatalog;
import com.project_exam.backend.shared.security.RequirePermission;

import com.project_exam.backend.modules.gamification.coin.dto.CoinBalanceRequest;
import com.project_exam.backend.modules.gamification.coin.dto.CoinUpsertRequest;
import com.project_exam.backend.modules.gamification.coin.dto.CoinWalletResponse;
import com.project_exam.backend.modules.gamification.coin.service.CoinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequirePermission(PermissionCatalog.COIN_MANAGE)
@RequestMapping("/api/admin/coins")
@RequiredArgsConstructor
public class CoinAdminController {

    private final CoinService coinService;

    @GetMapping
    public ResponseEntity<List<CoinWalletResponse>> getAll() {
        return ResponseEntity.ok(coinService.findAllWallets());
    }

    @PostMapping
    public ResponseEntity<CoinWalletResponse> create(
            @Valid @RequestBody CoinUpsertRequest request
    ) {
        CoinWalletResponse created = coinService.create(request.getUserId(), request.getBalance());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<CoinWalletResponse> updateBalance(
            @PathVariable String userId,
            @Valid @RequestBody CoinBalanceRequest request
    ) {
        return ResponseEntity.ok(coinService.updateBalance(userId, request.getBalance()));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> delete(@PathVariable String userId) {
        coinService.delete(userId);
        return ResponseEntity.noContent().build();
    }
}
