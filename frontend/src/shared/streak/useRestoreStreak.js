import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restoreStreak } from '~/shared/api/streakApi';
import { STREAK_QUERY_KEY } from '~/shared/context/StreakContext';
import { COINS_QUERY_KEY } from '~/shared/context/CoinContext';

export function useRestoreStreak({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => restoreStreak(),
    onSuccess: (result, ...rest) => {
      // Đẩy dữ liệu streak mới vào cache để UI cập nhật tức thì, rồi invalidate để đồng bộ.
      qc.setQueryData(STREAK_QUERY_KEY, result);
      qc.invalidateQueries({ queryKey: STREAK_QUERY_KEY });
      // Khôi phục tốn xu -> làm mới số dư xu.
      qc.invalidateQueries({ queryKey: COINS_QUERY_KEY });
      if (onSuccess) onSuccess(result, ...rest);
    },
    onError,
  });
}
