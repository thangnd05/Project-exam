'use client';

import { createContext, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { queryClient } from '@/app/configs/queryClient';
import { getCurrentUser, logout as logoutRequest } from '@/app/apis/authApi';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import { buildLoginUrlFromHere } from '@/app/utils/authRedirect';
import routes from '@/app/configs/Routes';

export type AuthUser = {
  userId: string;
  userName?: string | null;
  fullName?: string | null;
  email?: string | null;
  roleId?: string | number | null;
  roleName?: string | null;
  permissions: string[];
  avatarUrl?: string | null;
  isPremium: boolean;
};

export type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (userData: unknown) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  userId?: string;
  roleId?: string | number | null;
  roleName?: string | null;
  permissions: string[];
  avatarUrl?: string | null;
  isPremium: boolean;
  isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const CURRENT_USER_QUERY_KEY = ['currentUser'];

// Chỉ xoá dữ liệu gắn với tài khoản (bài thi dở, trình độ đã chọn). Các cờ "đã xem gợi ý",
// mã khách truy cập... thuộc về trình duyệt; xoá đi thì popup gợi ý lại hiện sau mỗi lần đăng xuất.
const USER_STORAGE_PREFIXES = ['userTest-', 'userTestState-', 'winde:learner-level'];

const clearUserStorage = () => {
  try {
    Object.keys(localStorage)
      .filter((key) => USER_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix)))
      .forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();
  } catch {
    // Trình duyệt chặn storage thì bỏ qua.
  }
};

const normalizeUser = (data: any): AuthUser => ({
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {

  const expiredToastShownRef = useRef(false);

  const userRef = useRef<AuthUser | null>(null);

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
    const google = (window as any).google;
    if (google) {
      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        auto_select: false,
        itp_support: true,
      });
      google.accounts.id.cancel();
    }
  }, []);

  useEffect(() => {
    const handleAuthExpired = (e: Event) => {

      if (!userRef.current) return;

      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      clearUserStorage();

      if (!expiredToastShownRef.current) {
        expiredToastShownRef.current = true;
        const reason =
          (e as CustomEvent<{ reason?: string }>)?.detail?.reason ||
          'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.';
        toast.info(reason);
      }

      const publicPaths = [routes.login, routes.forgot, routes.reset];
      const onPublicPage = publicPaths.some((p) => window.location.pathname.startsWith(p));
      if (!onPublicPage) {
        // Kèm from để đăng nhập lại xong quay về đúng trang đang xem.
        window.location.href = buildLoginUrlFromHere();
      }
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    userRef.current = user;
    if (user) expiredToastShownRef.current = false;
  }, [user]);

  useEffect(() => {
    document.documentElement.dataset.theme = user?.isPremium ? 'premium' : 'normal';
  }, [user?.isPremium]);

  const login = useCallback((userData: unknown) => {
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      clearUserStorage();
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser,
      userId: user?.userId,
      roleId: user?.roleId,
      roleName: user?.roleName,
      permissions: user?.permissions ?? EMPTY_LIST,
      avatarUrl: user?.avatarUrl,
      isPremium: user?.isPremium ?? false,
      isAuthenticated: !!user?.userId,
    }),
    [user, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
