const STORAGE_KEY = 'guestSessionId';

const generateSessionId = (): string => {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return 'g-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
};

export const getOrCreateGuestSessionId = (): string | null => {
  if (typeof window === 'undefined') return null;
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateSessionId();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
};

export const getGuestSessionId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
};

export const clearGuestSessionId = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const guestHeaders = (sessionId: string | null | undefined): Record<string, string> =>
  sessionId ? { 'X-Guest-Session': sessionId } : {};
