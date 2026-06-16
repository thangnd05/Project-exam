import { createContext, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { queryClient } from '~/config/queryClient';
import { getCurrentUser, logout as logoutRequest } from '../api/authApi';

export const AuthContext = createContext(null);

// Query key cho user hiện tại (gồm roleName + permissions[] do /me trả về).
export const CURRENT_USER_QUERY_KEY = ['currentUser'];

export const AuthProvider = ({ children }) => {
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
    roleName: data.roleName,
    // Danh sách permission code (RBAC) BE trả ở luồng login/me; mặc định [] nếu thiếu.
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    avatarUrl: data.avatarUrl,
  });

  // Nguồn sự thật về user = React Query (/me).
  // staleTime:0 + refetchOnWindowFocus:true → quay lại tab là tự làm mới quyền (RBAC đổi không cần F5).
  // invalidateQueries(CURRENT_USER_QUERY_KEY) ở bất cứ đâu cũng ép nạp lại quyền ngay.
  const { data, isLoading } = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getCurrentUser,
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false, // /me lỗi = chưa đăng nhập, không thử lại
  });

  const user = data?.id ? normalizeUser(data) : null;
  const loading = isLoading;

  // Làm mới quyền/thông tin user mà không cần F5 — gọi ở bất cứ đâu qua useAuth().refreshUser().
  const refreshUser = useCallback(
    () => queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }),
    [],
  );

  //  Chạy khi app khởi động: khởi tạo Google SDK (user đã do useQuery lo).
  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        auto_select: false,
        itp_support: true,
      });
      window.google.accounts.id.cancel();
    }
  }, []);

  // Lắng nghe sự kiện refresh fail từ axiosClient: clear state, toast 1 lần, redirect về login.
  // Why: khi BE phát hiện replay / revoke family / token hết hạn, không nên để user kẹt ở UI
  // "đã đăng nhập" mà mọi request đều 401 — phải đẩy về login ngay.
  useEffect(() => {
    const handleAuthExpired = (e) => {
      // Bỏ qua nếu user chưa từng login (vd: /me ban đầu fail khi vào app lần đầu).
      // Why: tránh hiển thị toast "phiên hết hạn" cho visitor chưa từng đăng nhập.
      if (!userRef.current) return;

      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
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

  //  Login (backend trả thẳng UserResponse gồm roleName + permissions) → nạp vào cache.
  const login = useCallback((userData) => {
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, userData);
  }, []);

  //  Logout
  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      localStorage.clear();
      sessionStorage.clear();
    }
  }, []);

  //  Value export ra toàn app
  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser,
      userId: user?.userId,
      roleId: user?.roleId,
      roleName: user?.roleName,
      permissions: user?.permissions ?? [],
      avatarUrl: user?.avatarUrl,
      isAuthenticated: !!user?.userId,
    }),
    [user, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
