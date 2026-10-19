'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_PALETTE, isPalette, PALETTE_STORAGE_KEY, type Palette } from '@/app/constants/theme';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-palette'] });
  return () => observer.disconnect();
}

const getSnapshot = (): Palette => {
  const current = document.documentElement.dataset.palette;
  return isPalette(current) ? current : DEFAULT_PALETTE;
};
const getServerSnapshot = (): Palette => DEFAULT_PALETTE;

export function usePalette() {
  const palette = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setPalette = useCallback((next: Palette) => {
    document.documentElement.dataset.palette = next;
    try {
      window.localStorage.setItem(PALETTE_STORAGE_KEY, next);
    } catch {}
  }, []);

  return { palette, setPalette };
}

export default usePalette;
