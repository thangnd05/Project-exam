'use client';

import { usePathname } from 'next/navigation';
import {useEffect} from 'react';

import {trackVisit} from '@/app/apis/analyticsApi';

let lastPath: string | null = null;
let lastTime = 0;

const VisitTracker = () => {
  const pathname = usePathname();

  useEffect(() => {
    const path = pathname;
    const now = Date.now();
    if (path === lastPath && now - lastTime < 2000) return;
    lastPath = path;
    lastTime = now;
    trackVisit(path);
  }, [pathname]);

  return null;
};

export default VisitTracker;
