import {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { getMyStreak, restoreStreak as restoreStreakApi } from '~/api/streakApi';
import { useAuth } from '~/hooks/useAuth';

export const StreakContext = createContext(null);

export const StreakProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  // Chuỗi vừa đứt còn khôi phục được (số ngày + giá xu + có cho khôi phục không).
  const [lostStreak, setLostStreak] = useState(0);
  const [canRecover, setCanRecover] = useState(false);
  const [recoverCost, setRecoverCost] = useState(0);
  // Cờ để bật popup chúc mừng khi streak vừa tăng (component popup tự reset).
  const [justIncreased, setJustIncreased] = useState(false);
  // Giữ giá trị mới nhất để refreshStreak so sánh mà không phụ thuộc closure cũ.
  const currentRef = useRef(0);

  const applyStreak = useCallback((data, { celebrate = false } = {}) => {
    const next = data?.currentStreak ?? 0;
    if (celebrate && next > currentRef.current) {
      setJustIncreased(true);
    }
    currentRef.current = next;
    setCurrentStreak(next);
    setLongestStreak(data?.longestStreak ?? 0);
    setLostStreak(data?.lostStreak ?? 0);
    setCanRecover(Boolean(data?.canRecover));
    setRecoverCost(data?.recoverCost ?? 0);
  }, []);

  // Load streak lúc mount / khi đăng nhập. Khi logout thì reset về 0.
  useEffect(() => {
    if (!isAuthenticated) {
      currentRef.current = 0;
      setCurrentStreak(0);
      setLongestStreak(0);
      setLostStreak(0);
      setCanRecover(false);
      setRecoverCost(0);
      setJustIncreased(false);
      return;
    }
    getMyStreak()
      .then((data) => applyStreak(data))
      .catch(() => {});
  }, [isAuthenticated, applyStreak]);

  // Gọi sau khi user hoàn thành 1 hoạt động học; nếu streak tăng -> bật popup.
  const refreshStreak = useCallback(() => {
    if (!isAuthenticated) return Promise.resolve();
    return getMyStreak()
      .then((data) => applyStreak(data, { celebrate: true }))
      .catch(() => {});
  }, [isAuthenticated, applyStreak]);

  // Khôi phục chuỗi đã đứt (tốn xu). Ném lỗi để UI tự toast; cập nhật state khi thành công.
  const restoreStreak = useCallback(() => {
    return restoreStreakApi().then((data) => {
      applyStreak(data);
      return data;
    });
  }, [applyStreak]);

  const clearJustIncreased = useCallback(() => setJustIncreased(false), []);

  const value = useMemo(
    () => ({
      currentStreak,
      longestStreak,
      lostStreak,
      canRecover,
      recoverCost,
      justIncreased,
      refreshStreak,
      restoreStreak,
      clearJustIncreased,
    }),
    [
      currentStreak,
      longestStreak,
      lostStreak,
      canRecover,
      recoverCost,
      justIncreased,
      refreshStreak,
      restoreStreak,
      clearJustIncreased,
    ]
  );

  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
};
