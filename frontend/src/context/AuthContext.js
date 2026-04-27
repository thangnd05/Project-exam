import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Chuẩn hóa user từ DTO backend
  const normalizeUser = (data) => ({
    userId: data.id,
    userName: data.userName,
    fullName: data.fullName,
    email: data.email,
    roleId: data.roleId,
    avatarUrl: data.avatarUrl,
  });

  // ✅ Lấy user hiện tại từ /me
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await axios.get('/api/auth/me');

      if (response.data?.id) {
        setUser(normalizeUser(response.data));
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Chạy khi app khởi động
  useEffect(() => {
    fetchCurrentUser();

    // Google SDK fix avatar ma
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        auto_select: false,
        itp_support: true,
      });
      window.google.accounts.id.cancel();
    }
  }, [fetchCurrentUser]);

  // ✅ Login (backend trả thẳng UserResponse)
  const login = useCallback((userData) => {
    setUser(normalizeUser(userData));
  }, []);

  // ✅ Logout
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

  // ✅ Value export ra toàn app
  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      userId: user?.userId,
      roleId: user?.roleId,
      avatarUrl: user?.avatarUrl,
      isAuthenticated: !!user?.userId,
    }),
    [user, loading, login]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
