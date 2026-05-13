const STORAGE_KEY = 'guestSessionId';

const generateSessionId = () => {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return 'g-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
};

export const getOrCreateGuestSessionId = () => {
  if (typeof window === 'undefined') return null;
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateSessionId();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
};

export const getGuestSessionId = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
};

export const guestHeaders = (sessionId) =>
  sessionId ? { 'X-Guest-Session': sessionId } : {};
