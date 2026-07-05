/**
 * Dữ liệu cho trang lịch sử làm bài — dùng react-query thay cho useEffect + setLoading thủ công.
 *
 * Đây là MẪU cho việc chuyển dần các trang tự-fetch sang react-query (đã cấu hình sẵn ở
 * config/queryClient.js + QueryClientProvider trong App.js). Lợi ích: tự cache, tự chống race,
 * bỏ boilerplate loading/error, và quay lại trang không phải fetch lại (staleTime 1 phút).
 */
import { useQuery } from '@tanstack/react-query';
import { getMyAttemptsByTest } from '~/api/userTestApi';
import { getUserTestInfo } from '~/api/testApi';

export const testHistoryKeys = {
  attempts: (testId) => ['test-attempts', testId],
  info: (testId) => ['test-info', testId],
};

// BE có thể trả mảng trực tiếp hoặc { data: [...] } -> chuẩn hoá về mảng.
const normalizeAttempts = (payload) =>
  Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

export function useTestHistory(testId) {
  const attemptsQuery = useQuery({
    queryKey: testHistoryKeys.attempts(testId),
    queryFn: () => getMyAttemptsByTest(testId),
    enabled: !!testId,
    select: normalizeAttempts,
  });

  const infoQuery = useQuery({
    queryKey: testHistoryKeys.info(testId),
    queryFn: () => getUserTestInfo(testId),
    enabled: !!testId,
  });

  return {
    attempts: attemptsQuery.data ?? [],
    testInfo: infoQuery.data ?? null,
    isLoading: attemptsQuery.isLoading || infoQuery.isLoading,
  };
}
