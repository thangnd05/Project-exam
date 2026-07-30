import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';

import {trackVisit} from '~/shared/api/analyticsApi';

let lastPath = null;
let lastTime = 0;

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
