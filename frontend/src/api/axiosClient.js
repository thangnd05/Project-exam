import axios from 'axios';

const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, "");

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

axiosClient.interceptors.request.use(
  (config) => {
    // Hàm đọc cookie
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    // Lấy token mới nhất từ trình duyệt
    const csrfToken = getCookie('XSRF-TOKEN');

    // Gắn vào Header nếu tồn tại
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────────────────────
// Response interceptor: tự refresh khi access token hết hạn (401).
// Refresh token là HttpOnly cookie với Path=/api/auth/refresh, browser tự đính kèm.
// Tránh vòng lặp: không refresh khi chính request bị fail là /login hoặc /refresh,
// và không refresh lần 2 cho cùng 1 request (cờ _retry).
// Khi đang refresh, các request 401 khác xếp hàng → resolve cùng lúc sau khi refresh xong.
// ──────────────────────────────────────────────────────────────
const AUTH_BYPASS_PATHS = ['/api/auth/refresh', '/api/auth/login'];
let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (error) => {
  pendingQueue.forEach(({resolve, reject}) => (error ? reject(error) : resolve()));
  pendingQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || '';
    const isAuthCall = AUTH_BYPASS_PATHS.some((p) => url.includes(p));

    if (status !== 401 || !original || original._retry || isAuthCall) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: () => resolve(axiosClient(original)),
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      await axiosClient.post('/api/auth/refresh');
      flushQueue(null);
      return axiosClient(original);
    } catch (refreshErr) {
      flushQueue(refreshErr);
      // Báo cho app biết session đã chết: hết hạn tự nhiên, replay detected,
      // hoặc family bị revoke (đổi pass ở device khác / logout-all). AuthContext sẽ clear state.
      window.dispatchEvent(new CustomEvent('auth:expired', {
        detail: { reason: refreshErr?.response?.data?.message },
      }));
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;
