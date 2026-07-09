import axios from 'axios';

const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, "");

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

axiosClient.interceptors.request.use(
  (config) => {

    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    const csrfToken = getCookie('XSRF-TOKEN');

    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
