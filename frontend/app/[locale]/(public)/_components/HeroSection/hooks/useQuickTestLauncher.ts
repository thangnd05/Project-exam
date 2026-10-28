'use client';

import {useCallback, useState} from 'react';
import { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import {useTranslations} from 'next-intl';

import {getUserTarget} from '@/app/apis/userTargetApi';
import routes, { buildTestPath } from '@/app/configs/Routes';
import {useAuth} from '@/app/hooks/useAuth';
import type {QuickChallengeCardResponse} from '@/app/types/test';
import {buildLoginUrl} from '@/app/utils/redirect';

// Luồng bắt đầu đề kiểm tra nhanh, dùng chung cho hero trang chủ và kho kỳ thi:
// chọn đề -> hộp xác nhận trình độ -> vào làm bài hoặc sinh lộ trình theo syllabus.
export function useQuickTestLauncher() {
  const t = useTranslations('Home.quickTest');
  const router = useRouter();
  const localizeHref = useLocalizeHref();
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
      router.push(localizeHref(buildTestPath(test, 'start')));
    },
    [router, localizeHref],
  );

  const startSyllabusPlan = useCallback(
    async (test: QuickChallengeCardResponse) => {
      setPendingTest(null);
      const examTypeId = test.examTypeId;
      if (!examTypeId) {
        router.push(localizeHref(routes.examTypes));
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
        router.push(localizeHref(buildLoginUrl(targetUrl, {
          flash: t('loginFlash'),
        })));
        return;
      }

      // Chưa có mục tiêu thì đặt trước, xong quay lại đúng bước sinh lộ trình.
      try {
        const target = await getUserTarget(examTypeId);
        if (!target?.hasTarget) {
          router.push(localizeHref(targetUrl));
          return;
        }
      } catch {
        // Không kiểm tra được mục tiêu thì cứ sang trang sinh lộ trình, ở đó vẫn xử lý được.
      }
      router.push(localizeHref(planUrl));
    },
    [router, isAuthenticated, authLoading, t, localizeHref],
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
