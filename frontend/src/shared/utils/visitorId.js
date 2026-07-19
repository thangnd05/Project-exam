// Mã "khách/thiết bị" ổn định RIÊNG cho analytics (lượt truy cập).
// KHÁC guestSessionId: cái kia bị clearGuestSessionId() xoá mỗi lần login (cơ chế claim-guest),
// khiến logout/login bị đếm thành lượt mới. Mã này KHÔNG bao giờ bị xoá khi login/logout,
// nên 1 khách vãng lai luôn được gom đúng phiên. (User đã đăng nhập thì backend gom theo userId.)
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
