import { createContext, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { queryClient } from '~/shared/config/queryClient';
import { getCurrentUser, logout as logoutRequest } from '~/shared/api/authApi';

export const AuthContext = createContext(null);

export const CURRENT_USER_QUERY_KEY = ['currentUser'];

const normalizeUser = (data) => ({
  userId: data.id,
  userName: data.userName,
  fullName: data.fullName,
  email: data.email,
  roleId: data.roleId,
  roleName: data.roleName,

  permissions: Array.isArray(data.permissions) ? data.permissions : [],
  avatarUrl: data.avatarUrl,
  isPremium: data.isPremium === true,
});

export const AuthProvider = ({ children }) => {

  const expiredToastShownRef = useRef(false);

  const userRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getCurrentUser,
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const user = useMemo(() => (data?.id ? normalizeUser(data) : null), [data]);
  const loading = isLoading;

  const refreshUser = useCallback(
    () => queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }),
    [],
  );

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        auto_select: false,
        itp_support: true,
      });
      window.google.accounts.id.cancel();
    }
  }, []);

  useEffect(() => {
    const handleAuthExpired = (e) => {

      if (!userRef.current) return;

      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      localStorage.clear();
      sessionStorage.clear();

      if (!expiredToastShownRef.current) {
        expiredToastShownRef.current = true;
        const reason = e?.detail?.reason || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.';
        toast.info(reason);
      }

      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
      const onPublicPage = publicPaths.some((p) => window.location.pathname.startsWith(p));
      if (!onPublicPage) {
        window.location.href = '/login';
      }
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    userRef.current = user;
    if (user) expiredToastShownRef.current = false;
  }, [user]);

  // Theme toàn app theo trạng thái premium: premium -> tông vàng kim loại
  // (mặc định :root), user thường/khách -> tông xanh dương (data-theme="normal").
  useEffect(() => {
    document.documentElement.dataset.theme = user?.isPremium ? 'premium' : 'normal';
  }, [user?.isPremium]);

  const login = useCallback((userData) => {
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, userData);
  }, []);

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
      isPremium: user?.isPremium ?? false,
      isAuthenticated: !!user?.userId,
    }),
    [user, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
