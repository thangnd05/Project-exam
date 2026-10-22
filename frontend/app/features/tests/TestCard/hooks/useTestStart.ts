'use client';

import { useRouter } from '@/app/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { getTestStatus, splitCountdown } from '@/app/features/tests/testStatusHelper';
import type { TestModeSelection } from '@/app/features/tests/TestModeModal/TestModeModal';
import { useAuth } from '@/app/hooks/useAuth';
import { useGuestAllowedCategories } from '@/app/features/tests/TestCard/hooks/useGuestAllowedCategories';
import { buildLoginUrl } from '@/app/features/auth/authRedirect';
import type { TestResponse } from '@/app/types';
import { buildTestPath } from '@/app/configs/Routes';

// Trạng thái đề + luồng bấm "Bắt đầu" (khách cần đăng nhập, chọn chế độ thi) dùng chung cho thẻ và hàng đề.
export function useTestStart(test: TestResponse, countdowns?: Record<string, number>) {
  const router = useRouter();
  const t = useTranslations('Tests');
  const now = new Date();
  const [showModeModal, setShowModeModal] = useState(false);

  // testStatusHelper trả key dịch (Tests.status.*, Tests.action.*), ở đây dịch theo ngôn ngữ đang dùng.
  const { status, statusLabelKey, buttonKey, remainingMs, canStart } = getTestStatus(test, now, countdowns);
  const statusLabel = t(`status.${statusLabelKey}`);
  const buttonText =
    buttonKey === 'opensIn'
      ? t('action.opensIn', { time: t('action.countdown', splitCountdown(remainingMs ?? 0)) })
      : t(`action.${buttonKey}`);

  // Lịch sử và bảng xếp hạng cần đăng nhập, khách bấm vào sẽ bị đẩy sang trang đăng nhập.
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isGuest = !authLoading && !isAuthenticated;
  const { isGuestAllowed } = useGuestAllowedCategories(isGuest);
  // null = chưa biết (đang tải hoặc đã đăng nhập) thì không hiện nhãn.
  const guestAllowed = isGuest ? isGuestAllowed(test) : null;
  const needsLogin = guestAllowed === false;
  const showLeaderboard =
    isAuthenticated && (test.availableTo == null || now > new Date(test.availableTo));

  const handleStart = () => {
    if (!canStart) return;
    // Khách mở đề cần tài khoản thì đưa thẳng sang đăng nhập, không để bấm tới bước bắt đầu mới biết.
    if (needsLogin) {
      router.push(
        buildLoginUrl(window.location.pathname + window.location.search, {
          flash: t('loginFlash'),
        }),
      );
      return;
    }
    setShowModeModal(true);
  };

  const handleSelectMode = ({ mode, examPartIds }: TestModeSelection) => {
    setShowModeModal(false);
    const params = new URLSearchParams();
    if (mode === 'practice') {
      params.set('mode', 'practice');
      if (examPartIds?.length) params.set('parts', examPartIds.join(','));
    }
    const qs = params.toString();
    router.push(`${buildTestPath(test, 'start')}${qs ? `?${qs}` : ''}`);
  };

  return {
    status,
    statusLabel,
    buttonText,
    canStart,
    isAuthenticated,
    guestAllowed,
    needsLogin,
    showLeaderboard,
    handleStart,
    modeModal: {
      show: showModeModal,
      onClose: () => setShowModeModal(false),
      onStart: handleSelectMode,
    },
  };
}
