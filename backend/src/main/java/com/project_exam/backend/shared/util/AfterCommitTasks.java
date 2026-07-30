package com.project_exam.backend.shared.util;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public final class AfterCommitTasks {

    private AfterCommitTasks() {
    }

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

        }
    }
}
