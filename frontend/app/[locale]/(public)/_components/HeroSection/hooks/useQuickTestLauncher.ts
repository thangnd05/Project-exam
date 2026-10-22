'use client';

import {useCallback, useState} from 'react';
import {useRouter} from 'next/navigation';

import {getUserTarget} from '@/app/apis/userTargetApi';
import routes, { buildTestPath } from '@/app/configs/Routes';
import {useAuth} from '@/app/hooks/useAuth';
import type {QuickChallengeCardResponse} from '@/app/types/test';
import {buildLoginUrl} from '@/app/features/auth/authRedirect';

// Luồng bắt đầu đề kiểm tra nhanh, dùng chung cho hero trang chủ và kho kỳ thi:
// chọn đề -> hộp xác nhận trình độ -> vào làm bài hoặc sinh lộ trình theo syllabus.
export function useQuickTestLauncher() {
  const router = useRouter();
  const {isAuthenticated, loading: authLoading} = useAuth();
  const [pendingTest, setPendingTest] = useState<QuickChallengeCardResponse | null>(null);

  const requestStart = useCallback((test: QuickChallengeCardResponse | null) => {
    if (!test) return;
    setPendingTest(test);
  }, []);

  const closeConfirm = useCallback(() => {
    setPendingTest(null);
  }, []);

  const confirmStart = useCallback(
    (test: QuickChallengeCardResponse) => {
      setPendingTest(null);
      router.push(buildTestPath(test, 'start'));
    },
    [router],
  );

  const startSyllabusPlan = useCallback(
    async (test: QuickChallengeCardResponse) => {
      setPendingTest(null);
      const examTypeId = test.examTypeId;
      if (!examTypeId) {
        router.push(routes.examTypes);
        return;
      }

      const planUrl = `${routes.generatePlan}?${new URLSearchParams({
        examTypeId,
        source: 'syllabus',
      }).toString()}`;

      const targetUrl = `${routes.myTarget}?${new URLSearchParams({
        examTypeId,
        next: planUrl,
      }).toString()}`;

      // Khách đăng nhập trước, xong quay về đúng bước đặt mục tiêu rồi sinh lộ trình.
      if (!authLoading && !isAuthenticated) {
        router.push(buildLoginUrl(targetUrl, {
          flash: 'Đăng nhập để xây lộ trình cá nhân hóa cho kỳ thi này.',
        }));
        return;
      }

      // Chưa có mục tiêu thì đặt trước, xong quay lại đúng bước sinh lộ trình.
      try {
        const target = await getUserTarget(examTypeId);
        if (!target?.hasTarget) {
          router.push(targetUrl);
          return;
        }
      } catch {
        // Không kiểm tra được mục tiêu thì cứ sang trang sinh lộ trình, ở đó vẫn xử lý được.
      }
      router.push(planUrl);
    },
    [router, isAuthenticated, authLoading],
  );

  return {
    pendingTest,
    requestStart,
    closeConfirm,
    confirmStart,
    startSyllabusPlan,
    isGuest: !authLoading && !isAuthenticated,
  };
}
