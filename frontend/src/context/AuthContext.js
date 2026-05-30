import { createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { getCurrentUser, logout as logoutRequest } from '../api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Tránh toast trùng khi nhiều request 401 cùng lúc trigger refresh fail.
  const expiredToastShownRef = useRef(false);
  // Mirror user vào ref để handler event đọc giá trị mới nhất (closure trong addEventListener).
  const userRef = useRef(null);

  //  Chuẩn hóa user từ DTO backend
  const normalizeUser = (data) => ({
    userId: data.id,
    userName: data.userName,
    fullName: data.fullName,
    email: data.email,
    roleId: data.roleId,
    avatarUrl: data.avatarUrl,
  });

  //  Lấy user hiện tại từ /me
  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await getCurrentUser();

      if (data?.id) {
        setUser(normalizeUser(data));
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  //  Chạy khi app khởi động
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

  // Lắng nghe sự kiện refresh fail từ axiosClient: clear state, toast 1 lần, redirect về login.
  // Why: khi BE phát hiện replay / revoke family / token hết hạn, không nên để user kẹt ở UI
  // "đã đăng nhập" mà mọi request đều 401 — phải đẩy về login ngay.
  useEffect(() => {
    const handleAuthExpired = (e) => {
      // Bỏ qua nếu user chưa từng login (vd: fetchCurrentUser ban đầu fail khi vào app lần đầu).
      // Why: tránh hiển thị toast "phiên hết hạn" cho visitor chưa từng đăng nhập.
      if (!userRef.current) return;

      setUser(null);
      localStorage.clear();
      sessionStorage.clear();

      if (!expiredToastShownRef.current) {
        expiredToastShownRef.current = true;
        const reason = e?.detail?.reason || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.';
        toast.info(reason);
      }

      // AuthProvider wrap ngoài Router → không dùng useNavigate, fallback location.
      // Bỏ qua nếu đang ở trang public (tránh redirect vô nghĩa).
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
      const onPublicPage = publicPaths.some((p) => window.location.pathname.startsWith(p));
      if (!onPublicPage) {
        window.location.href = '/login';
      }
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  // Sync user vào ref + reset cờ toast khi user login lại thành công.
  useEffect(() => {
    userRef.current = user;
    if (user) expiredToastShownRef.current = false;
  }, [user]);

  //  Login (backend trả thẳng UserResponse)
  const login = useCallback((userData) => {
    setUser(normalizeUser(userData));
  }, []);

  //  Logout
  const logout = async () => {
    try {
      await logoutRequest();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  //  Value export ra toàn app
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
