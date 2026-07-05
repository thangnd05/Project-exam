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

// Xoá guestSessionId (gọi sau khi đã claim bài guest vào tài khoản khi đăng nhập)
// để phiên guest tiếp theo (sau logout) bắt đầu sạch, không claim nhầm.
export const clearGuestSessionId = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const guestHeaders = (sessionId) =>
  sessionId ? { 'X-Guest-Session': sessionId } : {};
