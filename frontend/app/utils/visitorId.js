

const STORAGE_KEY = 'analyticsVisitorId';

const generateId = () => {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return 'v-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
};

export const getOrCreateVisitorId = () => {
  if (typeof window === 'undefined') return null;
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateId();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
};
