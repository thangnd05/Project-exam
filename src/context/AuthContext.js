import { createContext, useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Hàm chuẩn hóa user từ API DTO
  const normalizeUser = (data) => ({
    userId: data.id,
    username: data.username,
    email: data.email,
    roleId: data.roleId,
    avatarUrl: data.avatarUrl,
  });

  // 1. Lấy user hiện tại từ /me
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await axios.get("/api/auth/me");

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

  // 2. Chạy khi app khởi động
  useEffect(() => {
    fetchCurrentUser();

    // Google SDK (giữ nguyên)
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        auto_select: false,
        itp_support: true,
      });
      window.google.accounts.id.cancel();
    }
  }, [fetchCurrentUser]);

  // 3. Login (nhận thẳng UserResponse)
  const login = (userData) => {
    setUser(normalizeUser(userData));
  };

  // 4. Logout
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
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
      roleId: user?.roleId,
      isAuthenticated: !!user?.userId,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
