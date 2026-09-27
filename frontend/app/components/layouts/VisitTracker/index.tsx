'use client';

import { usePathname } from 'next/navigation';
import {useEffect, useRef} from 'react';

import {trackVisit} from '@/app/apis/analyticsApi';

// 1 lượt truy cập = 1 phiên: chỉ ping BE khi không có hoạt động quá SESSION_GAP_MS
// (khớp SESSION_GAP ở VisitTrackingService). Hoạt động = chuyển route, click/gõ phím/cuộn,
// quay lại tab — chỉ cập nhật mốc hoạt động trong localStorage, không gọi BE.
const LAST_ACTIVITY_KEY = 'analyticsLastActivity';
const SESSION_GAP_MS = 30 * 60 * 1000;
// Giới hạn tần suất xử lý sự kiện tương tác (cuộn/click bắn rất dày).
const ACTIVITY_THROTTLE_MS = 60 * 1000;

const readLastActivity = (): number => {
  try {
    return Number(window.localStorage.getItem(LAST_ACTIVITY_KEY)) || 0;
  } catch {
    return 0;
  }
};

const writeLastActivity = (time: number) => {
  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(time));
  } catch {
    // storage bị chặn (private mode...) -> BE vẫn chặn trùng theo session_key
  }
};

let lastTouch = 0;

const touch = (path: string, force = false) => {
  const now = Date.now();
  if (!force && now - lastTouch < ACTIVITY_THROTTLE_MS) return;
  lastTouch = now;
  const isNewSession = now - readLastActivity() > SESSION_GAP_MS;
  writeLastActivity(now);
  if (isNewSession) trackVisit(path);
};

const VisitTracker = () => {
  const pathname = usePathname();
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
    touch(pathname, true);
  }, [pathname]);

  useEffect(() => {
    const onActivity = () => touch(pathRef.current);
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
  }, []);

  return null;
};

export default VisitTracker;
