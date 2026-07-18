import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';

import {trackVisit} from '~/shared/api/analyticsApi';

// Chống đếm trùng: StrictMode gọi effect 2 lần + điều hướng lặp nhanh cùng 1 path.
let lastPath = null;
let lastTime = 0;

/** Ping 1 lượt xem trang mỗi lần đổi route (đặt bên trong Router). */
const VisitTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const now = Date.now();
    if (path === lastPath && now - lastTime < 2000) return;
    lastPath = path;
    lastTime = now;
    trackVisit(path);
  }, [location.pathname]);

  return null;
};

export default VisitTracker;
