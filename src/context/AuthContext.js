import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';


export const AuthContext = createContext(null);


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  // 1. Hàm lấy User hiện tại (được bọc trong useCallback để dùng ổn định)
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await axios.get('/api/auth/me');
      if (response.data && (response.data.id || response.data.userId)) {
        setUser({
          userId: response.data.id || response.data.userId,
          username: response.data.username || response.data.name || response.data.email,
          email: response.data.email,
          role: response.data.role,
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Chạy khi ứng dụng khởi động
  useEffect(() => {
    // Gọi check session ngay lập tức
    fetchCurrentUser();

    // Cấu hình Google SDK để NĂM SAU nó cũng không tự hiện "Avatar ma"
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        auto_select: false, // ❌ QUAN TRỌNG: Tắt tự động chọn
        itp_support: true,
      });
      // Hủy mọi tiến trình prompt đang chạy ngầm của Google
      window.google.accounts.id.cancel();
    }
  }, [fetchCurrentUser]);

  // 3. Hàm login
  const login = (userData) => {
    setUser({
      userId: userData.id || userData.userId,
      username: userData.username || userData.name || userData.email,
      email: userData.email,
      role: userData.role,
    });
  };

  // 4. Hàm logout
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      userId: user?.userId,
      isAuthenticated: !!user && !!user.userId,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};