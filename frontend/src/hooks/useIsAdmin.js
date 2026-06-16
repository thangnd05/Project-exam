import { useAuth } from './useAuth';

// roleName đã có sẵn trong AuthContext (BE trả ở login/me) → không cần gọi /api/roles nữa.
// Lưu ý: ưu tiên gate theo permission (usePermission) thay vì theo role; hook này giữ cho
// các chỗ thực sự cần biết "có phải ADMIN không".
export const useIsAdmin = () => {
  const { roleName } = useAuth();
  return roleName === 'ADMIN';
};
