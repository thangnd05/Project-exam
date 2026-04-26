import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import GlobalStyles from "./components/GlobalStyles/GlobalStyles";
import axios from "axios";

// 1. Cấu hình cơ bản
const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL).trim().replace(/\/$/, "");
axios.defaults.baseURL = apiBaseUrl;
axios.defaults.withCredentials = true;
axios.interceptors.request.use((config) => {
  // 1. Hàm đọc cookie
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // 2. Lấy token mới nhất từ trình duyệt
  const csrfToken = getCookie('XSRF-TOKEN');

  // 3. Gắn vào Header nếu tồn tại
  if (csrfToken) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <GlobalStyles>
    <App />
  </GlobalStyles>
);