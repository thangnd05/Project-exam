import { queryClient } from '@/app/configs/queryClient';
import { claimGuestTests } from '@/app/apis/userTestApi';
import { getGuestSessionId, clearGuestSessionId, setGuestClaimIntent, takeGuestClaimIntent } from '@/app/utils/guestSession';

// Chỉ gắn bài khi khách đã bấm "Đăng nhập & lưu". Đăng nhập theo đường khác thì bỏ phiên khách,
// bài vẫn nằm trong database dạng khách (userId = null).
export const claimGuestAfterLogin = async (): Promise<number> => {
  const guestSessionId = getGuestSessionId();
  const userTestId = takeGuestClaimIntent();
  if (!guestSessionId) return 0;
  if (!userTestId) {
    clearGuestSessionId();
    return 0;
  }
  try {
    const res = await claimGuestTests(guestSessionId, userTestId);
    clearGuestSessionId();

    queryClient.invalidateQueries();
    return res?.claimed || 0;
  } catch (err) {
    // Lỗi mạng thì giữ lại ý định lưu để lần đăng nhập sau gắn tiếp.
    setGuestClaimIntent(userTestId);
    console.error('Claim guest tests failed:', err);
    return 0;
  }
};
