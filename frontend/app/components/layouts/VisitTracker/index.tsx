'use client';

import { usePathname } from '@/app/i18n/navigation';
import {useCallback, useEffect, useRef} from 'react';

import {trackVisit} from '@/app/apis/analyticsApi';
import {getCurrentUser} from '@/app/apis/authApi';
import {queryClient} from '@/app/configs/queryClient';
import {CURRENT_USER_QUERY_KEY} from '@/app/contexts/AuthContext';
import {useAuth} from '@/app/hooks/useAuth';

// 1 lượt truy cập = 1 phiên: chỉ ping BE khi không có hoạt động quá SESSION_GAP_MS
// (khớp SESSION_GAP ở VisitTrackingService). Hoạt động = chuyển route, click/gõ phím/cuộn,
// quay lại tab — chỉ cập nhật mốc hoạt động trong localStorage, không gọi BE.
const LAST_ACTIVITY_KEY = 'analyticsLastActivity';
// userId đã gắn vào phiên hiện tại ('' = khách): đăng nhập giữa phiên thì ping identify đúng một lần.
const SESSION_USER_KEY = 'analyticsSessionUser';
const SESSION_GAP_MS = 30 * 60 * 1000;
// Giới hạn tần suất xử lý sự kiện tương tác (cuộn/click bắn rất dày).
const ACTIVITY_THROTTLE_MS = 60 * 1000;
// /me thành công trong khoảng này thì coi access token còn hạn, khỏi gọi lại.
const AUTH_FRESH_MS = 60 * 1000;

const readStorage = (key: string): string => {
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage bị chặn (private mode...) -> BE vẫn chặn trùng theo session_key
  }
};

let lastTouch = 0;

// Ghi nhận hoạt động; trả true nếu hoạt động này mở phiên mới.
const touch = (force = false): boolean => {
  const now = Date.now();
  if (!force && now - lastTouch < ACTIVITY_THROTTLE_MS) return false;
  lastTouch = now;
  const isNewSession = now - (Number(readStorage(LAST_ACTIVITY_KEY)) || 0) > SESSION_GAP_MS;
  writeStorage(LAST_ACTIVITY_KEY, String(now));
  return isNewSession;
};

// Access token chỉ sống 15 phút mà phiên mới chỉ mở sau 30 phút nghỉ, nên lúc này cookie thường đã hết hạn.
// Gọi /me (interceptor tự refresh) trước khi ping, nếu không BE ghi người đã đăng nhập thành khách.
const startSession = async (path: string, userId: string | undefined) => {
  let sessionUser = '';
  if (userId) {
    const me = await queryClient
      .fetchQuery({queryKey: CURRENT_USER_QUERY_KEY, queryFn: getCurrentUser, staleTime: AUTH_FRESH_MS})
      .catch(() => null);
    sessionUser = me?.id ?? '';
  }
  writeStorage(SESSION_USER_KEY, sessionUser);
  await trackVisit(path);
};

const VisitTracker = () => {
  const pathname = usePathname();
  const {userId, loading} = useAuth();
  const pathRef = useRef(pathname);
  const authRef = useRef({userId, loading});
  // pending: đã mở phiên mới nhưng chờ AuthContext tải xong user; starting: đang gửi ping đầu phiên.
  const sessionRef = useRef<'idle' | 'pending' | 'starting'>('idle');

  // Đăng nhập giữa phiên (phiên mở lúc còn là khách): gắn user vào lượt hiện tại.
  const identifyIfNeeded = useCallback(() => {
    const {userId: currentUserId, loading: authLoading} = authRef.current;
    if (authLoading || sessionRef.current !== 'idle') return;
    if (currentUserId && readStorage(SESSION_USER_KEY) !== currentUserId) {
      writeStorage(SESSION_USER_KEY, currentUserId);
      trackVisit(pathRef.current, true);
    }
  }, []);

  const tryStartSession = useCallback(() => {
    if (sessionRef.current !== 'pending' || authRef.current.loading) return;
    sessionRef.current = 'starting';
    startSession(pathRef.current, authRef.current.userId).finally(() => {
      sessionRef.current = 'idle';
      identifyIfNeeded();
    });
  }, [identifyIfNeeded]);

  const onTouch = useCallback((force = false) => {
    if (touch(force) && sessionRef.current === 'idle') {
      sessionRef.current = 'pending';
      tryStartSession();
    }
  }, [tryStartSession]);

  useEffect(() => {
    authRef.current = {userId, loading};
    tryStartSession();
    identifyIfNeeded();
  }, [userId, loading, tryStartSession, identifyIfNeeded]);

  useEffect(() => {
    pathRef.current = pathname;
    onTouch(true);
  }, [pathname, onTouch]);

  useEffect(() => {
    const onActivity = () => onTouch();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onActivity();
    };
    const opts: AddEventListenerOptions = {passive: true, capture: true};

    window.addEventListener('pointerdown', onActivity, opts);
    window.addEventListener('keydown', onActivity, opts);
    window.addEventListener('scroll', onActivity, opts);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pointerdown', onActivity, opts);
      window.removeEventListener('keydown', onActivity, opts);
      window.removeEventListener('scroll', onActivity, opts);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [onTouch]);

  return null;
};

export default VisitTracker;
