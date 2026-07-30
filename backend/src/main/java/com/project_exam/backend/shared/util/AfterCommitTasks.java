package com.project_exam.backend.shared.util;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Chạy side-effect (streak, đồng bộ tiến độ mục tiêu...) SAU khi transaction chính commit.
 *
 * <p>Gọi thẳng trong transaction rất nguy hiểm: nếu side-effect ném exception từ một bean
 * {@code @Transactional} khác, transaction hiện tại bị đánh dấu rollback-only. Lúc đó
 * {@code try/catch} ở chỗ gọi KHÔNG cứu được — commit vẫn nổ UnexpectedRollbackException và
 * việc chính (nộp bài) bị mất. Chạy sau commit thì việc chính đã an toàn, đồng thời side-effect
 * đọc được đúng dữ liệu đã chốt.
 */
public final class AfterCommitTasks {

    private AfterCommitTasks() {
    }

    /** Không có transaction đang mở thì chạy luôn. Lỗi của side-effect bị nuốt có chủ đích. */
    public static void runQuietly(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            executeQuietly(action);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                executeQuietly(action);
            }
        });
    }

    private static void executeQuietly(Runnable action) {
        try {
            action.run();
        } catch (Exception ignored) {
            // Side-effect hỏng không được ảnh hưởng tới việc chính.
        }
    }
}
