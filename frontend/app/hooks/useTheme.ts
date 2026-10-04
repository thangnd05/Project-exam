'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function readStoredTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.setAttribute('data-bs-theme', theme);
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

const getSnapshot = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
const getServerSnapshot = (): Theme => 'light';

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const onSystemChange = (event: MediaQueryListEvent) => {
      if (!readStoredTheme()) applyTheme(event.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', onSystemChange);
    return () => media.removeEventListener('change', onSystemChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(getSnapshot() === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}

export default useTheme;
