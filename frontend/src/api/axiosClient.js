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

export default axiosClient;
